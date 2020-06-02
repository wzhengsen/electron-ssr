import { Menu, nativeImage, Tray } from 'electron'
import { appConfig$ } from './data'
import * as handler from './tray-handler'
import { groupConfigs } from '@/shared/utils'
import { isMac, isWin, isOldMacVersion } from '../shared/env'
import { disabledTray, enabledHighlightTray, enabledTray, globalHighlightTray, globalTray, pacHighlightTray, pacTray } from '../shared/icon'
import * as i18n from './locales'
import bootstrap from './bootstrap'
const $t = i18n.default
let tray

/**
 * 生成服务器子菜单
 * @param {*Array<Object>} configs ssr配置集合
 * @param {*Number} selectedIndex 选中的ssr配置的索引
 */
function generateConfigSubmenus (configs, selectedIndex) {
  const groups = groupConfigs(configs, selectedIndex)
  const submenus = Object.keys(groups).map(key => {
    const groupedConfigs = groups[key]
    return {
      label: `${groupedConfigs.some(config => config.checked) ? '● ' : ''}${key}`,
      submenu: groupedConfigs.map(config => {
        return {
          id: config.id,
          label: `${config.remarks}(${config.server}:${config.server_port})`,
          type: 'checkbox',
          checked: config.checked,
          click (e) {
            const index = configs.findIndex(config => config.id === e.id)
            if (index === selectedIndex) {
              // 点击的是当前节点
              e.checked = true
            } else {
              handler.switchConfig(configs.findIndex(config => config.id === e.id))
            }
          }
        }
      })
    }
  })
  if (!configs || !configs.length) {
    submenus.push({ label: 'none', enabled: false })
  }
  submenus.push({ type: 'separator' })
  submenus.push({ label: $t('TRAY_EDIT_SERVER'), click: handler.showManagePanel })
  submenus.push({ label: $t('TRAY_SUB_SETTINGS'), click: handler.showSubscribes })
  submenus.push({ label: $t('TRAY_UPDATE_SUB_LINK'), click: handler.updateSubscribes })
  return submenus
}

/**
 * 根据应用配置生成菜单
 * @param {Object} appConfig 应用配置
 */
async function generateMenus (appConfig) {
  i18n.setLocal(appConfig.lang || 'en-US')
  let menuHelp = {
    label: $t('MENU_HELP'),
    submenu: [
      { label: $t('MENU_SUB_DEVS_INSPECT_LOG'), click: handler.openLog }
    ]
  }
  const base = [
    { label: $t('TRAY_MAIN_PAGE'), click: handler.showManagePanel },
    {
      label: $t('MENU_SUB_ENABLE_APP'),
      type: 'checkbox',
      checked: appConfig.enable,
      click: () => {
        handler.toggleEnable()
        handler.toggleProxy(appConfig.sysProxyMode)
      }
    },
    { label: $t('MENU_SUB_COPY_HTTP_PROXY'), click: handler.copyHttpProxyCode },
    {
      label: $t('MENU_PAC'),
      submenu: [
        { label: $t('MENU_SUB_UPDATE_PAC'), click: handler.updatePac }
      ]
    },
    { label: $t('TRAY_SERVERS'), submenu: generateConfigSubmenus(appConfig.configs, appConfig.index) },
    { label: $t('MENU_SUB_ADD_FROM_QR_SCAN'), click: handler.scanQRCode },
    {
      label: $t('MENU_SETTINGS'),
      submenu: [
        { label: $t('MENU_SUB_SETTING_OPTIONS'), click: handler.showOptions },
        { label: $t('MENU_SUB_LOAD_CF'), click: handler.importConfigFromFile },
        { label: $t('MENU_SUB_EXPORT_CF'), click: handler.exportConfigToFile },
        { label: $t('MENU_SUB_ADD_FROM_CB'), click: handler.importConfigFromClipboard },
        { label: $t('MENU_SUB_OPEN_CF'), click: handler.openConfigFile }
      ]
    },
    menuHelp,
    { role: 'quit' }
  ]
  let macToolPathExist = appConfig['isMacToolInstalled']
  if (!isMac || (!await isOldMacVersion && macToolPathExist)) {
    base.splice(1, 0,
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
  if (!await isOldMacVersion && isMac) {
    menuHelp.submenu.push({
      label: 'Install Help Tool',
      click: handler.installMacHelpToolTray
    })
  }
  return base
}

// 切换代理
export function changeProxy (e, mode, appConfig) {
  if (mode === appConfig.sysProxyMode) {
    e.checked = true
  } else {
    handler.toggleProxy(mode)
  }
}

// 根据配置显示tray tooltip
function getTooltip (appConfig) {
  if (!appConfig.enable) {
    return 'ShadowsocksR客户端：应用未启动'
  }
  const arr = []
  if (appConfig.enable) {
    arr.push('ShadowsocksR客户端：应用已启动\n')
  }
  arr.push('代理启动方式：')
  if (appConfig.sysProxyMode === 0) {
    arr.push('未启用代理')
  } else if (appConfig.sysProxyMode === 1) {
    arr.push('PAC代理')
  } else if (appConfig.sysProxyMode === 2) {
    arr.push('全局代理')
  }
  const activatedConfig = appConfig.configs[appConfig.index]
  if (activatedConfig) {
    arr.push('\n')
    arr.push(`${activatedConfig.group ? activatedConfig.group + ' - ' : ''}${activatedConfig.remarks || (activatedConfig.server + ':' + activatedConfig.server_port)}`)
  }
  return arr.join('')
}

/**
 * 更新任务栏菜单
 * @param {Object} appConfig 应用配置
 */
async function updateTray (appConfig) {
  const menus = await generateMenus(appConfig)
  const contextMenu = Menu.buildFromTemplate(menus)
  tray.setContextMenu(contextMenu)
  tray.setToolTip(getTooltip(appConfig))
}

// 根据应用状态显示不同的图标
function setTrayIcon (appConfig) {
  if (appConfig.enable) {
    if (appConfig.sysProxyMode === 1) {
      tray.setImage(pacTray)
      isMac && tray.setPressedImage(pacHighlightTray)
    } else if (appConfig.sysProxyMode === 2) {
      tray.setImage(globalTray)
      isMac && tray.setPressedImage(globalHighlightTray)
    } else {
      tray.setImage(enabledTray)
      isMac && tray.setPressedImage(enabledHighlightTray)
    }
  } else {
    tray.setImage(disabledTray)
    isMac && tray.setPressedImage(disabledTray)
  }
}

/**
 * 渲染托盘图标和托盘菜单
 */
async function renderTray (appConfig) {
  await bootstrap
  // 生成tray
  tray = new Tray(nativeImage.createEmpty())
  updateTray(appConfig)
  setTrayIcon(appConfig)
  tray.on((isMac || isWin) ? 'double-click' : 'click', handler.showMainWindow)
}

/**
 * 销毁托盘
 */
export function destroyTray () {
  if (tray) {
    tray.destroy()
  }
}

// 监听数据变更
appConfig$.subscribe(data => {
  const [appConfig, changed] = data
  if (!changed.length) {
    renderTray(appConfig)
  } else {
    if (['configs', 'index', 'enable', 'sysProxyMode', 'isMacToolInstalled'].some(key => changed.indexOf(key) > -1)) {
      updateTray(appConfig)
    }
    if (['enable', 'sysProxyMode'].some(key => changed.indexOf(key) > -1)) {
      setTrayIcon(appConfig)
    }
  }
})
