import Base64 from 'urlsafe-base64'
import { generateID, isNumber, isObject } from './utils'

export function encode (str) {
  return Base64.encode(Buffer.from(str, 'utf-8'))
}

export function decode (str) {
  return Base64.decode(str).toString('utf-8')
}

export function getSSRLink (config) {
  const required = [config.server, config.server_port, config.protocol,
    config.method, config.obfs, encode(config.password)]
  const others = []
  config.obfsparam && others.push(`obfsparam=${encode(config.obfsparam)}`)
  config.protocolparam && others.push(`protoparam=${encode(config.protocolparam)}`)
  config.remarks && others.push(`remarks=${encode(config.remarks)}`)
  config.group && others.push(`group=${encode(config.group)}`)
  const link = `ssr://${encode(required.join(':') + '/?' + others.join('&'))}`
  return link
}
export function isValidSSRConfig (config) {
  return !!(config.server && config.server_port && config.password && config.method && config.protocol && config.obfs)
}
export function getSSLink (config) {
  const link = `${config.method}:${config.password}@${config.server}:${config.server_port}`
  const encoded = encode(link)
  return `ss://${encoded}${config.remarks ? '#' + config.remarks : ''}`
}
export function fromSSRLink (link) {
  let defaultConfig = defaultSSRConfig()
  if (link) {
    const [valid, requiredSplit, otherSplit] = isSSRLinkValid(link)
    if (valid) {
      defaultConfig.server = requiredSplit[0]
      defaultConfig.server_port = +requiredSplit[1]
      defaultConfig.protocol = requiredSplit[2]
      defaultConfig.method = requiredSplit[3]
      defaultConfig.obfs = requiredSplit[4]
      defaultConfig.password = decode(requiredSplit[5])
      if (otherSplit.obfsparam) {
        defaultConfig.obfsparam = decode(otherSplit.obfsparam)
      }
      if (otherSplit.protoparam) {
        defaultConfig.protocolparam = decode(otherSplit.protoparam)
      }
      if (otherSplit.remarks) {
        defaultConfig.remarks = decode(otherSplit.remarks)
      }
      if (otherSplit.group) {
        defaultConfig.group = decode(otherSplit.group)
      }
    }
  }
  return defaultConfig
}
function ssrMerge (ssr, target) {
  if (isObject(target)) {
    Object.keys(target).forEach(key => {
      if (ssr[key] !== undefined) {
        ssr[key] = isNumber(ssr[key]) ? +target[key] : target[key]
      }
    })
  }
}
// eslint-disable-next-line no-unused-vars
export function defaultSSRConfig (config) {
  let obj = {}
  obj.server = '127.0.0.1'
  obj.server_port = 8388
  obj.password = '0'
  obj.method = 'aes-256-cfb'
  obj.protocol = 'origin'
  obj.protocolparam = ''
  obj.obfs = 'plain'
  obj.obfsparam = ''
  obj.remarks = ''
  obj.group = ''
  ssrMerge(obj, config)
  obj.id = generateID()
  obj.enable = true
  return obj
}
// convert to plain object
// TODO update unit test code

// ssr://xxx 地址是否正确
function isSSRLinkValid (link) {
  try {
    const body = link.substring(6)
    const decoded = decode(body)
    const _split = decoded.split('/?')
    const required = _split[0]
    const others = _split[1]
    const requiredSplit = required.split(':')
    if (requiredSplit.length !== 6) {
      return [false]
    }
    const otherSplit = {}
    others && others.split('&').forEach(item => {
      const _params = item.split('=')
      otherSplit[_params[0]] = _params[1]
    })
    return [true, requiredSplit, otherSplit]
  } catch (e) {
    return [false]
  }
}

// ss://xxx 地址是否正确
function isSSLinkValid (link) {
  try {
    let body = link.substring(5)
    const _split = body.split('#')
    body = _split[0]
    const decoded = decode(body)
    const split1 = decoded.split('@')
    const split2 = split1[0].split(':')
    const split3 = split1[1].split(':')
    if (split2.length !== 2 || split3.length !== 2) {
      return [false]
    }
    return [true, split2, split3, _split[1]]
  } catch (e) {
    return [false]
  }
}

/**
 * 判断链接是否是可用的ss(r)地址
 * @param {String} link 要判断的链接
 */
export function isLinkValid (link) {
  if (/^ssr:\/\//.test(link)) {
    return isSSRLinkValid(link)
  } else if (/^ss:\/\//.test(link)) {
    return isSSLinkValid(link)
  }
  return [false]
}

// 根据字符串导入配置，字符串使用\n或空格间隔
export function loadConfigsFromString (strings) {
  if (strings) {
    const arr = strings.split(/[\n ]/)
    const avaliable = []
    arr.forEach(str => {
      if (/^ssr:\/\//.test(str)) {
        if (isSSRLinkValid(str)[0]) {
          avaliable.push(fromSSRLink(str))
        }
      } else if (/^ss:\/\//.test(str)) {
        if (isSSLinkValid(str)[0]) {
          avaliable.push(fromSSRLink(str))
        }
      }
    })
    if (avaliable.length) {
      return avaliable
    }
  }
  return []
}
