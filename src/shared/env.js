
import os from 'os'
import { exec } from 'child_process'

export const platform = os.platform()

export const isWin = platform === 'win32'
export const isMac = platform === 'darwin'
export const isLinux = platform === 'linux'

// python 是否已安装
export let isPythonInstalled = new Promise((resolve) => {
  exec(`python -c "print('hello')"`, (err, stdout) => {
    if (err) {
      resolve(false)
    } else {
      resolve(/^hello$/.test(stdout.toString().trim()))
    }
  })
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
