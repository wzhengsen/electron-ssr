import { ipcRenderer } from 'electron'
import store from './store'
import { showNotification, showHtmlNotification } from './notification'
import scanQrcode from './qrcode/scan-screenshot'
import * as events from '../shared/events'
import { loadConfigsFromString } from '../shared/ssr'
import i18n from './i18n'
// const $t = i18n.t
console.log(i18n.t('NOTI_SUB_FAIL_UPDATE'))
/**
 * ipc-render事件
 */
export function register () {
  ipcRenderer.on(events.EVENT_APP_NOTIFY_MAIN, (e, { title, body }) => {
    // 显示main进程的通知
    showHtmlNotification(body, title)
  }).on(events.EVENT_APP_SCAN_DESKTOP, () => {
    // 扫描二维码
    scanQrcode((e, result) => {
      if (e) {
        showNotification(i18n.t('NOTI_FAILED_TO_FIND_QRCODE'), i18n.t('NOTI_TYPE_ERROR_QRCODE'))
      } else {
        const configs = loadConfigsFromString(result)
        if (configs.length) {
          store.dispatch('addConfigs', configs)
          showNotification(i18n.t('NOTI_SUCC_ADD_CONFIGS', { count: configs.length }))
        }
      }
    })
  }).on(events.EVENT_APP_SHOW_PAGE, (e, targetView) => {
    // 显示具体某页面
    console.log('received view update: ', targetView.page, targetView.tab)
    store.commit('updateView', { ...targetView, fromMain: true })
  }).on(events.EVENT_APP_ERROR_MAIN, (e, err) => {
    // 弹框显示main进程报错内容
    alert(err)
  }).on(events.EVENT_SUBSCRIBE_UPDATE_MAIN, (e) => {
    // 更新订阅服务器
    store.dispatch('updateSubscribes').then(updatedCount => {
      if (updatedCount > 0) {
        showNotification(i18n.t('NOTI_SUB_SUCC_UPDATE_COUNT', { count: updatedCount }))
      } else {
        showNotification(i18n.t('NOTI_SUB_SUCC_UPDATE_NO_COUNT'))
      }
    }).catch(() => {
      showNotification(i18n.t('NOTI_SUB_FAIL_UPDATE'))
    })
  }).on(events.EVENT_RX_SYNC_MAIN, (e, appConfig) => {
    // 同步数据
    console.log('received sync data: %o', appConfig)
    store.commit('updateConfig', [appConfig])
  }).on(events.EVENT_CONFIG_CREATE, () => {
    store.dispatch('newConfig')
  }).on(events.EVENT_SUBSCRIBE_NEW, () => {
    store.dispatch('newSubscription')
  })
}
/**
 * 与main进程同步配置项
 * @param {Object} appConfig 用于更新的应用配置
 */
export function syncConfig (appConfig) {
  console.log('start sync data: %o', appConfig)
  ipcRenderer.send(events.EVENT_RX_SYNC_RENDERER, appConfig)
}

/**
 * 主动获取初始化数据
 */
export function getInitConfig () {
  console.log('get init config data')
  ipcRenderer.send(events.EVENT_APP_WEB_INIT)
  return new Promise((resolve) => {
    ipcRenderer.on(events.EVENT_APP_WEB_INIT, (event, res) => {
      store.dispatch('initConfig', res)
      resolve()
    })
  })
}

/**
 * 隐藏窗口
 */
export function hideWindow () {
  ipcRenderer.send(events.EVENT_APP_HIDE_WINDOW)
}

/**
 * 打开本地文件/目录
 */
export function openDialog (options) {
  return new Promise((resolve) => {
    ipcRenderer.send(events.EVENT_APP_OPEN_DIALOG, options)
    ipcRenderer.on(events.EVENT_APP_OPEN_DIALOG, (_, result) => {
      resolve(result)
    })
  })
}
export function saveUpdateTime () {
  ipcRenderer.send(events.EVENT_SUBSCRIBE_SAVE_TIME)
}
