const request = require('request')
const os = require('os')
const path = require('path')
const fs = require('fs')
const { ensureDir, copy, readdir } = require('fs-extra')
const { exec } = require('child_process')
const unzipper = require('unzipper')
const chalk = require('chalk')
const cliProgress = require('cli-progress')
const Socks5ClientHttpsAgent = require('socks5-https-client/lib/Agent')
const tmpDir = path.join(os.tmpdir(), 'electron-ssr-deps-fetch')
const copyDir = path.join(process.cwd(), 'src', 'lib')
console.log(`tmpDir: ${tmpDir}`)
console.log(`copyDir: ${copyDir}`)

function fetchIndex (url) {
  return new Promise((resolve, reject) => {
    console.log(`Start Fetching: ${url}`)
    let option = {
      url: url,
      headers: {
        'User-Agent': 'electron-ssr'
      }
    }
    withProxy(option)
    withGHToken(option)
    request(option, (err, resp, body) => {
      if (err) {
        reject(err)
      } else {
        console.log('Response Headers')
        console.log(resp.headers)
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          console.error(`Failed to parse: ${body} err: ${error}`)
          reject(error)
        }
      }
    })
  })
}
async function getSocks2http () {
  const releaseIndex = 'https://api.github.com/repos/xVanTuring/socks2http-rs/releases/latest'
  let index = await fetchIndex(releaseIndex)
  let assets = index['assets']
  if (!(assets && assets.length && assets.length !== 0)) {
    console.error('assets is invalid')
    console.log(assets)
    console.log(index)
    index = await fetchIndex(releaseIndex)
    assets = index['assets']
  }
  let withName = 'linux'
  switch (process.platform) {
    case 'win32':
      withName = 'windows'
      break
    case 'linux':
      break
    case 'darwin':
      withName = 'osx'
      break
    default:
      console.error('Unsupported system')
      return
  }
  let downloadPath = path.join(tmpDir, 'socks2http.zip')
  for (const asset of assets) {
    if (asset['name'].indexOf(withName) >= 0) {
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  await extractFile(downloadPath)
  let socks2httpName = 'socks2http'
  if (process.platform === 'win32') {
    socks2httpName += '.exe'
  }
  let copiedPath = path.join(copyDir, socks2httpName)
  await copy(path.join(tmpDir, socks2httpName), copiedPath)
  if (process.platform !== 'win32') {
    await new Promise((resolve, reject) => {
      console.log(`executing chmod +x ${copiedPath}`)
      exec(['chmod', '+x', copiedPath].join(' '), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
async function getSysProxy () {
  const releaseIndex = 'https://api.github.com/repos/xVanTuring/sysproxy/releases/latest'
  let index = await fetchIndex(releaseIndex)
  const assets = index['assets']
  let downloadPath = path.join(tmpDir, 'sysproxy.exe')
  for (const asset of assets) {
    if (asset['name'].indexOf('64') >= 0) {
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  let copiedPath = path.join(copyDir, 'sysproxy.exe')
  await copy(downloadPath, copiedPath)
}
async function getWindowsKill () {
  const releaseIndex = 'https://api.github.com/repos/alirdn/windows-kill/releases/latest'
  let index = await fetchIndex(releaseIndex)
  const assets = index['assets']
  let downloadPath = path.join(tmpDir, 'windows-kill.zip')
  let folderName = ''
  for (const asset of assets) {
    if (asset['name'].startsWith('windows-kill_x64')) {
      folderName = asset['name'].replace('.zip', '')
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  await extractFile(downloadPath)
  await copy(path.join(tmpDir, folderName, 'windows-kill.exe'), path.join(copyDir, 'windows-kill.exe'))
}
/**
 *
 * @param {string} url
 * @param {string} path
 */
function downloadFile (url, path) {
  return new Promise((resolve, reject) => {
    let useMirror = process.argv.indexOf('-m') >= 0
    // let isDebug = process.argv.indexOf('-d') >= 0
    if (useMirror) {
      const mirrorHost = 'http://github-mirror.bugkiller.org'
      console.log(chalk.red(`Using github-mirror from ${mirrorHost}, it may not be safe.`))
      url = url.replace('https://github.com', mirrorHost)
    }
    console.log(`Start Downloading: ${url}`)
    const file = fs.createWriteStream(path)
    let option = {
      url: url,
      header: {
        'User-Agent': 'electron-ssr'
      }
    }
    if (!useMirror) {
      withProxy(option)
      withGHToken(option)
    }
    let req = request(option)
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
    req.on('error', (error) => {
      reject(error)
      bar.stop()
    })
    req.on('response', (resp) => {
      bar.start(parseInt(resp.headers['content-length'], 10), 0)
    })
    req.pipe(file)
    let sum = 0
    req.on('data', (chunk) => {
      sum += chunk.length
      bar.update(sum)
    })
    file.on('close', () => {
      bar.stop()
      resolve()
    })
  })
}
async function getLibsodium () {
  const releaseIndex = 'https://api.github.com/repos/xVanTuring/libsodium-msvc-release/releases/latest'
  let index = await fetchIndex(releaseIndex)
  const assets = index['assets']
  const libsodiumName = 'libsodium.dll'
  let downloadPath = path.join(tmpDir, libsodiumName)
  for (const asset of assets) {
    if (asset['name'] === 'libsodium.dll') {
      await downloadFile(asset['browser_download_url'], downloadPath)
      break
    }
  }
  let copiedPath = path.join(copyDir, libsodiumName)
  console.log(`Copy File to ${copiedPath}`)
  await copy(downloadPath, copiedPath)
}
function extractFile (zipPath) {
  return new Promise((resolve, reject) => {
    console.log(`Start Unzipping ${zipPath}`)
    fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: tmpDir }))
      .on('finish', resolve)
      .on('error', reject)
  })
}
let agent = null
function withProxy (option) {
  let proxy = process.env.http_proxy || process.env.all_proxy || process.env.fetch_proxy
  if (proxy) {
    if (proxy.startsWith('socks5://')) {
      console.log(`Using Socks5 Proxy ${proxy}`)
      if (agent == null) {
        let url = new (require('url').URL)(proxy)
        agent = new Socks5ClientHttpsAgent({
          socksHost: url.hostname,
          socksPort: parseInt(url.port, 10)
        })
      }
      option['agent'] = agent
      return
    }
    console.log(`Using proxy: ${proxy}`)
    option['proxy'] = proxy
  }
}
function withGHToken (option) {
  if (process.env.GH_TOKEN) {
    console.log(`Find GH_TOKE ${process.env.GH_TOKEN.substr(0, 10)}...`)
    if (!option['headers']) {
      option['headers'] = {}
    }
    option['headers']['Authorization'] = `token ${process.env.GH_TOKEN}`
  }
}

async function main () {
  await ensureDir(tmpDir)
  await getSocks2http()
  if (process.platform === 'win32') {
    await getSysProxy()
    await getLibsodium()
    await getWindowsKill()
  }
  await printLib()
}
async function printLib () {
  console.log('---LISTING LIB DIR---')
  let result = await readdir(copyDir)
  for (const fileName of result) {
    console.log(path.join(copyDir, fileName))
  }
}
try {
  main()
} catch (error) {
  console.error(error)
}
