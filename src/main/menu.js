import { app, Menu } from 'electron'
import { appConfig$, currentConfig } from './data'
import { changeProxy } from './tray'
import * as handler from './tray-handler'
import * as events from '../shared/events'
import { checkUpdate } from './updater'
import { isMac, isLinux } from '../shared/env'
import { sendData } from './window'

let showLinuxMenu = true
/**
 * 渲染菜单
 */
export default function renderMenu (appConfig) {
  // mac需要加上默认的一些菜单，否则没法复制粘贴
  let template
  if (isMac) {
    template = [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ] }, {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    }]
  } else if (isLinux) {
    if (showLinuxMenu) {
      template = [
        { label: '应用',
          submenu: [
            { label: '开启应用', type: 'checkbox', checked: appConfig.enable, click: handler.toggleEnable },
            { label: '复制http代理设置', click: handler.copyHttpProxyCode },
            { label: '退出', click: handler.exitApp }
          ] },
        { label: '系统代理模式',
          submenu: [
            { label: '不启用代理', type: 'checkbox', checked: appConfig.sysProxyMode === 0, click: e => changeProxy(e, 0, appConfig) },
            { label: 'PAC代理', type: 'checkbox', checked: appConfig.sysProxyMode === 1, click: e => changeProxy(e, 1, appConfig) },
            { label: '全局代理', type: 'checkbox', checked: appConfig.sysProxyMode === 2, click: e => changeProxy(e, 2, appConfig) }
          ] },
        { label: 'PAC',
          submenu: [
            { label: '更新PAC', click: handler.updatePac },
            { label: 'PAC模式',
              submenu: [
                { label: 'GFW List' },
                { label: 'White List' }
              ]
            }
          ] },
        { label: '设置',
          submenu: [
            { label: '选项设置', click: handler.showOptions },
            { label: '配置文件',
              submenu: [
                { label: '导入gui-config.json文件', click: handler.importConfigFromFile },
                { label: '导出gui-config.json文件', click: handler.exportConfigToFile },
                { label: '打开配置文件', click: handler.openConfigFile }
              ]
            },
            { label: '添加',
              submenu: [
                { label: '添加订阅链接', click: () => { sendData(events.EVENT_SUBSCRIBE_NEW) } },
                { label: '添加节点', click: createNewConfig },
                { label: '从剪贴板中添加' },
                { label: '二维码扫描', click: handler.scanQRCode }
              ]
            }
          ] },
        { label: '帮助',
          submenu: [
            { label: '检查更新', click: () => checkUpdate(true) },
            { label: '开发者',
              submenu: [
                { label: '查看日志', click: handler.openLog },
                { role: 'toggleDevTools' },
                { role: 'reload' },
                { role: 'forceReload' }
              ]
            }
            // { label: '项目主页', click: () => { handler.openURL('https://github.com/shadowsocksrr/electron-ssr') } },
            // { label: 'Bug反馈', click: () => { handler.openURL('https://github.com/shadowsocksrr/electron-ssr/issues') } },
            // { label: '捐赠', click: () => { handler.openURL('https://github.com/erguotou520/donate') } },
          ] }
      ]
    }
  }
  template && Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/**
 * 切换是否显示menu
 */
export function toggleMenu () {
  if (isLinux) {
    if (Menu.getApplicationMenu()) {
      showLinuxMenu = false
      Menu.setApplicationMenu(null)
    } else {
      showLinuxMenu = true
      renderMenu(currentConfig)
    }
  }
}
function createNewConfig () {
  sendData(events.EVENT_CONFIG_CREATE)
}
// 监听数据变更
appConfig$.subscribe(data => {
  const [appConfig, changed] = data
  if (!changed.length) {
    renderMenu(appConfig)
  } else {
    if (['enable', 'sysProxyMode'].some(key => changed.indexOf(key) > -1)) {
      renderMenu(appConfig)
    }
  }
})
