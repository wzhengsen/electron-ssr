let locale = 'en-US'
let en = require('./en-US.json')
export function setLocal (_locale) {
  locale = _locale
  dict = require(`./${locale}.json`) || en
}
let dict = null
export default function $t (key, format = null) {
  if (!dict) {
    dict = require(`./${locale}.json`) || en
  }
  if (format) {
    let raw = dict[key]
    for (const key in format) {
      if (format.hasOwnProperty(key)) {
        const element = format[key]
        let regexStr = `{${key}}`
        raw = raw.replace(new RegExp(regexStr, 'g'), element)
      }
    }
    return raw
  }
  return dict[key] || key
}
