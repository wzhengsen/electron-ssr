import { Menu } from 'electron'
import { appConfig$ } from './data'
import { changeProxy } from './tray'
import * as handler from './tray-handler'
import * as events from '../shared/events'
import { isMac, isOldMacVersion } from '../shared/env'
import { sendData } from './window'
import * as i18n from './locales'
import { readyPromise } from './bootstrap'
const $t = i18n.default
// todo provide a better menu
// do mac need app menu here?
async function renderMenu (appConfig) {
  await readyPromise
  i18n.setLocal(appConfig.lang || 'en-US')
  let template = [
    {
      label: $t('MENU_APPLICATION'),
      submenu: [
        { label: $t('MENU_SUB_ENABLE_APP'), type: 'checkbox', checked: appConfig.enable, click: handler.toggleEnable },
        { label: $t('MENU_SUB_COPY_HTTP_PROXY'), click: handler.copyHttpProxyCode },
        { role: 'quit' }
      ]
    },
    {
      label: $t('MENU_PAC'),
      submenu: [
        { label: $t('MENU_SUB_UPDATE_PAC'), click: handler.updatePac },
        {
          label: $t('MENU_SUB_PAC_MODE'),
          submenu: [
            { label: 'GFW List' },
            { label: 'White List' }
          ]
        }
      ]
    },
    {
      label: $t('MENU_SETTINGS'),
      submenu: [
        { label: $t('MENU_SUB_SETTING_OPTIONS'), click: handler.showOptions },
        { label: $t('MENU_SUB_LOAD_CF'), click: handler.importConfigFromFile },
        { label: $t('MENU_SUB_EXPORT_CF'), click: handler.exportConfigToFile },
        { label: $t('MENU_SUB_OPEN_CF'), click: handler.openConfigFile }
      ]
    },
    {
      label: $t('MENU_SUB_ADD'),
      submenu: [
        { label: $t('MENU_SUB_ADD_SUB_LINK'), click: () => { sendData(events.EVENT_SUBSCRIBE_NEW) } },
        { label: $t('MENU_SUB_ADD_NODE'), click: createNewConfig },
        { label: $t('MENU_SUB_ADD_FROM_CB'), click: handler.importConfigFromClipboard },
        { label: $t('MENU_SUB_ADD_FROM_QR_SCAN'), click: handler.scanQRCode }
      ]
    },
    {
      label: $t('MENU_HELP'),
      submenu: [
        {
          label: $t('MENU_SUB_DEVS'),
          submenu: [
            { label: $t('MENU_SUB_DEVS_INSPECT_LOG'), click: handler.openLog },
            { role: 'toggleDevTools' },
            { role: 'reload' },
            { role: 'forceReload' }
          ]
        }
      ]
    }
  ]
  if (isMac) {
    template.splice(1, 0, {
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
    })
  }
  let macToolPathExist = appConfig['isMacToolInstalled']
  if (!isMac || (!await isOldMacVersion && macToolPathExist)) {
    template.splice(2, 0,
      {
        label: $t('MENU_SYS_PROXY_MODE'),
        submenu: [
          { label: $t('MENU_SUB_NO_PROXY'), type: 'checkbox', checked: appConfig.sysProxyMode === 0, click: e => changeProxy(e, 0, appConfig) },
          { label: $t('MENU_SUB_PAC_PROXY'), type: 'checkbox', checked: appConfig.sysProxyMode === 1, click: e => changeProxy(e, 1, appConfig) },
          { label: $t('MENU_SUB_GLOBAL_PROXY'), type: 'checkbox', checked: appConfig.sysProxyMode === 2, click: e => changeProxy(e, 2, appConfig) }
        ]
      }
    )
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
function createNewConfig () {
  sendData(events.EVENT_CONFIG_CREATE)
}
// 监听数据变更
appConfig$.subscribe(data => {
  const [appConfig, changed] = data
  if (changed.length === 0) {
    renderMenu(appConfig)
  } else {
    if (['enable', 'sysProxyMode', 'lang', 'isMacToolInstalled'].some(key => changed.indexOf(key) > -1)) {
      renderMenu(appConfig)
    }
  }
})
