import { desktopCapturer, remote } from 'electron'
import jsQR from 'jsqr'
export default function scanQrcode (callback) {
  const thumbSize = determineScreenShotSize()
  desktopCapturer.getSources({ types: ['screen'], thumbnailSize: thumbSize }, (error, sources) => {
    if (error) throw error
    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i]
      if (source.name === 'Entire Screen') {
        const buffer = source.thumbnail.toBitmap()
        const { width, height } = source.thumbnail.getSize()
        const result = jsQR(buffer, width, height)
        if (result && result.data) {
          callback(null, result.data)
        } else {
          callback(new Error('No QRCode was found'))
        }
        return
      }
    }
  })
}

function determineScreenShotSize () {
  const screenSize = remote.screen.getPrimaryDisplay().workAreaSize
  const maxDimension = Math.max(screenSize.width, screenSize.height)
  return {
    width: maxDimension * window.devicePixelRatio,
    height: maxDimension * window.devicePixelRatio
  }
}
