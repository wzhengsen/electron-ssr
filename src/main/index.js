import { app, powerMonitor } from 'electron'
import AutoLaunch from 'auto-launch'
import bootstrapPromise from './bootstrap'
import { isQuiting, appConfig$, currentConfig, addConfigs } from './data'
import { destroyTray } from './tray'
import './menu'
import './ipc'
import { stopPacServer } from './pac'
import { stopHttpProxyServer } from './http-proxy'
import { stop as stopCommand, runWithConfig } from './client'
import { setProxyToNone } from './proxy'
import { createWindow, showWindow, getWindow, destroyWindow } from './window'
import { startTask, stopTask } from './subscribe'
import logger from './logger'
import { clearShortcuts } from './shortcut'
import { loadConfigsFromString } from '../shared/ssr'
import { isMac, isWin } from '../shared/env'
import {
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isPrimaryInstance = app.requestSingleInstanceLock()
const isDevelopment = process.env.NODE_ENV !== 'production' && !process.env.IS_TEST
if (!isPrimaryInstance) {
  app.exit()
} else {
  app.on('second-instance', (_, argv) => {
    showWindow()
    // 如果是通过链接打开的应用，则添加记录
    if (argv[1]) {
      const configs = loadConfigsFromString(argv[1])
      if (configs.length) {
        addConfigs(configs)
      }
    }
  })
  bootstrapPromise.then(async () => {
    if (isDevelopment) {
      console.log('Ensure Vue Devtools has been installed')
      installVueDevtools().catch(err => {
        logger.debug('Unable to install Vue Devtools', err)
      })
    }
    createWindow()
    // load manually when window created
    appConfig$.init()
    const AutoLauncher = new AutoLaunch({
      name: 'Electron SSR',
      isHidden: true,
      mac: {
        useLaunchAgent: true
      }
    })
    appConfig$.subscribe(async (data) => {
      const [appConfig, changed] = data
      if (changed.length === 0) {
        // if there is no config, or ssrPath is not set, show window
        // 初始化时没有配置则打开页面，有配置则不显示主页面
        if (!appConfig.hideWindow || appConfig.configs.length === 0 || !appConfig.ssrPath) {
          showWindow()
        }
      } else if (changed.indexOf('autoLaunch') > -1) {
        try {
          let enabled = await AutoLauncher.isEnabled()
          if (appConfig.autoLaunch !== enabled) {
            await AutoLauncher[appConfig.autoLaunch ? 'enable' : 'disable']()
          }
        } catch (error) {
          logger.error('Failed to process auto start')
          logger.error(error)
        }
      }
    })
    if (isWin || isMac) {
      app.setAsDefaultProtocolClient('ssr')
      app.setAsDefaultProtocolClient('ss')
    }
    // 电源状态检测
    powerMonitor.on('suspend', () => {
      // 系统挂起时
      logger.info('power suspend')
      stopTask()
      // setProxyToNone()
      stopCommand(true)
    }).on('resume', () => {
      // 恢复
      logger.info('power resumed')
      runWithConfig(currentConfig)
      // startProxy()
      startTask(currentConfig)
    })
  }).catch(err => {
    logger.error('Failed at bootstrapPromise')
    logger.error(err)
  })
  app.on('window-all-closed', () => {
    logger.debug('window-all-closed')
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // 由main进程发起的退出
  app.on('before-quit', () => { isQuiting(true) })

  app.on('will-quit', async (e) => {
    logger.debug('will-quit')
    e.preventDefault()
    const reflect = p => p.then(() => ({ status: 'fulfilled' }),
      e => ({ e, status: 'rejected' }))
    const asyncTask = [
      setProxyToNone(),
      stopHttpProxyServer(),
      stopPacServer(),
      stopCommand(true)
    ]
    await Promise.all(asyncTask.map(reflect)).then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error(result.e)
        }
      }
    })
    stopTask()
    destroyTray()
    clearShortcuts()
    destroyWindow()
    app.exit(0)
  })

  app.on('activate', () => {
    if (getWindow() === null) {
      createWindow()
    }
  })
}
