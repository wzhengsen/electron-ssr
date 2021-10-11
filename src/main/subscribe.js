import { readFile, writeFile } from 'fs-extra'
import { subscribeUpdateFile } from './bootstrap'
import { appConfig$ } from './data'
import { sendData } from './window'
import logger from './logger'
import { EVENT_SUBSCRIBE_UPDATE_MAIN } from '../shared/events'

// 上次更新时间
let lastUpdateTime
let _interval
let _timeout

/**
 * 更新订阅服务器任务
 * @param {Object} appConfig 应用配置
 * @param {Boolean} forceUpdate 是否强制更新
 */
export async function startTask (appConfig, forceUpdate = false) {
  stopTask()
  if (appConfig.autoUpdateSubscribes && appConfig.serverSubscribes.length) {
    if (forceUpdate) {
      await update()
    }
    // 单位是 时
    const intervalTime = appConfig.subscribeUpdateInterval * 3600000
    try {
      if (!forceUpdate) {
        const content = await readFile(subscribeUpdateFile, 'utf8')
        lastUpdateTime = new Date(content)
      }
      const nextUpdateTime = new Date(+lastUpdateTime + intervalTime)
      logger.info('next subscribe update time: %s', nextUpdateTime)
      timeout(nextUpdateTime, intervalTime, appConfig)
    } catch (e) {
      logger.error('Something wrong while starting subscribe task')
      logger.error(e)
      update()
    }
  }
}

// 间隔多久开始下一次更新，用下一次间隔时间减去当前时间
function timeout (nextUpdateTime, intervalTime, appConfig) {
  _timeout = setTimeout(() => {
    update()
    interval(intervalTime, appConfig)
  }, nextUpdateTime - new Date())
}

// 往后的更新都按照interval来进行
function interval (intervalTime, appConfig) {
  _interval = setInterval(() => {
    update()
  }, intervalTime)
}

// 保存最近一次的更新时间
export async function saveUpdateTime () {
  const date = new Date()
  lastUpdateTime = date
  logger.info('last update time: %s', lastUpdateTime)
  return writeFile(subscribeUpdateFile, date)
}

// 发起更新
async function update () {
  await saveUpdateTime()
  updateSubscribes()
}

// 更新订阅服务器
export function updateSubscribes () {
  sendData(EVENT_SUBSCRIBE_UPDATE_MAIN)
}

// 结束更新任务
export function stopTask () {
  if (_timeout) {
    clearTimeout(_timeout)
  }
  if (_interval) {
    clearInterval(_interval)
  }
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed] = data
  // 初始化
  if (changed.length === 0) {
    startTask(appConfig)
  } else {
    if (['autoUpdateSubscribes', 'subscribeUpdateInterval'].some(key => changed.indexOf(key) > -1)) {
      startTask(appConfig)
    }
  }
})
