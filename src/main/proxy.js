/**
 * 自动设置系统代理
 * linux目前仅支持gnome桌面的系统
 */
import { exec } from 'child_process'
import { pathExists } from 'fs-extra'
import { winToolPath, macToolPath } from './bootstrap'
import { currentConfig, appConfig$, updateAppConfig } from './data'
import logger from './logger'
import { isWin, isMac, isLinux, isOldMacVersion } from '../shared/env'

// linux的gsettings命令是否可用
let isGsettingsAvaliable = new Promise((resolve) => {
  exec('which gsettings', (err, stdout) => {
    if (err) {
      resolve(false)
    } else {
      resolve(/gsettings$/.test(stdout.toString().trim()))
    }
  })
})
let isProxyChanged = false

/**
 * 运行命令
 * @param {string} command 待运行的命令
 * @returns {Promise<void>}
 */
function runCommand (command) {
  return new Promise((resolve) => {
    if (command) {
      isProxyChanged = true
      try {
        exec(command, () => {
          resolve()
        })
      } catch (error) {
        logger.error(error)
        resolve()
      }
    } else {
      resolve()
    }
  })
}

/**
 * 设置代理为空,否则根据isProxyChanged字段判断是否需要设置为空
 * @param {boolean} force 强制设置
 */
export async function setProxyToNone (force = true) {
  if (force || isProxyChanged) {
    let command
    if (isWin && await pathExists(winToolPath)) {
      command = `${winToolPath} pac ""`
    } else if (isMac && await pathExists(macToolPath) && !await isOldMacVersion) {
      command = `"${macToolPath}" -m off`
    } else if (isLinux && await isGsettingsAvaliable) {
      command = `gsettings set org.gnome.system.proxy mode 'none'`
    }
    await runCommand(command)
  }
}

/**
 * 设置代理为全局
 */
async function setProxyToGlobal (host, port) {
  let command
  if (isWin && await pathExists(winToolPath)) {
    command = `${winToolPath} global ${host}:${port} "localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*;<local>"`
  } else if (isMac && await pathExists(macToolPath) && !await isOldMacVersion) {
    command = `"${macToolPath}" -m global -p ${port}`
  } else if (isLinux && await isGsettingsAvaliable) {
    if (currentConfig.preferHTTPGlobal === 1) {
      command = `gsettings set org.gnome.system.proxy mode 'manual' && gsettings set org.gnome.system.proxy.http host '${host}' && gsettings set org.gnome.system.proxy.http port ${port} && gsettings set org.gnome.system.proxy.https host '${host}' && gsettings set org.gnome.system.proxy.https port ${port}`
    } else {
      command = `gsettings set org.gnome.system.proxy mode 'manual' && gsettings set org.gnome.system.proxy.socks host '${host}' && gsettings set org.gnome.system.proxy.socks port ${port}`
    }
  }
  await runCommand(command)
}

/**
 * 设置代理为PAC代理
 */
async function setProxyToPac (pacUrl) {
  let command
  if (isWin && await pathExists(winToolPath)) {
    command = `${winToolPath} pac ${pacUrl}`
  } else if (isMac && await pathExists(macToolPath) && !await isOldMacVersion) {
    command = `"${macToolPath}" -m auto -u ${pacUrl}`
  } else if (isLinux && await isGsettingsAvaliable) {
    command = `gsettings set org.gnome.system.proxy mode 'auto' && gsettings set org.gnome.system.proxy autoconfig-url ${pacUrl}`
  }
  await runCommand(command)
}

async function setProxyByMode (mode) {
  if (mode === 0) {
    await setProxyToNone()
  } else if (mode === 1) {
    await setProxyToPac(`http://127.0.0.1:${currentConfig.pacPort}/proxy.pac`)
  } else if (mode === 2) {
    await setProxyToGlobal('127.0.0.1', (isWin || currentConfig.preferHTTPGlobal) ? currentConfig.httpProxyPort : currentConfig.localPort)
  }
}

/**
 * 切换系统代理
 */
export function switchSystemProxy () {
  const nextMode = (currentConfig.sysProxyMode + 1) % 3
  updateAppConfig({ sysProxyMode: nextMode })
  setProxyByMode(nextMode)
}

// 启用代理
export function startProxy (mode) {
  if (mode === undefined) {
    mode = currentConfig.sysProxyMode
  }
  setProxyByMode(mode)
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed, , isProxyStarted] = data
  if (isProxyStarted) {
    if (!changed.length) {
      startProxy(appConfig.sysProxyMode)
    } else {
      if (appConfig.sysProxyMode === 1 && (changed.indexOf('pacPort') > -1 || changed.indexOf('enable') > -1)) {
        // pacPort changes or enable changed
        startProxy(1)
      } else if (appConfig.sysProxyMode === 2 && (changed.indexOf('localPort') > -1 || changed.indexOf('enable') > -1 || changed.indexOf('preferHTTPGlobal') > -1)) {
        startProxy(2)
      }
    }
  } else if (changed.length) {
    setProxyToNone()
  }
})
