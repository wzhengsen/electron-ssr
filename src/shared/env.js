
import os from 'os'
import { exec } from 'child_process'
import util from 'util'
export const platform = os.platform()

export const isWin = platform === 'win32'
export const isMac = platform === 'darwin'
export const isLinux = platform === 'linux'
export let pythonName = 'python'
const execAsync = util.promisify(exec)
// python 是否已安装
export let isPythonInstalled = new Promise(async (resolve) => {
  try {
    let result = await execAsync(`python -c "print('hello')"`)
    resolve(/^hello$/.test(result.stdout.toString().trim()))
  } catch (error) {
    try {
      let result = await execAsync(`python3 -c "print('hello')"`)
      pythonName = 'python3'
      resolve(/^hello$/.test(result.stdout.toString().trim()))
    } catch (error) {
      resolve(false)
    }
  }
})

// mac版本号
let macVersion = null
// mac版本是否低于10.11
export let isOldMacVersion = new Promise((resolve) => {
  if (isMac) {
    exec('sw_vers', (err, stdout) => {
      if (err) {
        resolve(false)
      } else {
        macVersion = stdout.match(/ProductVersion:[ \t]*([\d.]*)/)[1]
        const matchedVersion = [10, 11, 0]
        const splited = macVersion.split('.')
        for (let i = 0; i < splited.length; i++) {
          if (splited[i] > matchedVersion[i]) {
            resolve(false)
          } else if (splited[i] < matchedVersion[i]) {
            resolve(true)
          } else if (i === 2 && splited[i] === matchedVersion[i]) {
            resolve(true)
          }
        }
      }
    })
  }
  resolve(false)
})
