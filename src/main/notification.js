import { Notification } from 'electron'
import { sendData } from './window'
import { EVENT_APP_NOTIFY_MAIN } from '../shared/events'
import { isMac } from '../shared/env'
import { notificationIcon } from '../shared/icon'
import logger from './logger'
import $t from './locales'
const isDesktopNotificationSupported = Notification.isSupported()

export function showNotification (body, title, onClick) {
  if (!title) {
    title = $t('NOTI')
  }
  if (isDesktopNotificationSupported) {
    const notification = new Notification({
      title, body, silent: false, icon: !isMac ? notificationIcon : undefined
    })
    if (onClick) {
      notification.once('click', onClick)
    }
    notification.show()
  } else {
    logger.debug('Using HTML Notification')
    sendData(EVENT_APP_NOTIFY_MAIN, { title, body })
  }
}
