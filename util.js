var Map = require('pull-stream/throughs/map')

  // opts standardized to work like levelup api
  function stdopts (opts) {
    opts = opts || {}
    opts.keys   = opts.keys   !== false //default keys to true
    opts.values = opts.values !== false //default values to true
    return opts
  }

  function msgFmt (keys, values, obj) {
    if (keys && values)
      return obj
    if (keys)
      return obj.key
    if (values)
      return obj.value
    return null // i guess?
  }

exports.options = stdopts
exports.format = msgFmt

exports.lo = null
exports.hi = undefined

exports.wait = function () {
  var waiting = [], value
  return {
    get: function () { return value },
    set: function (_value) {
      value = _value
      while(waiting.length)
        waiting.shift()(null, value)
    },
    wait: function (cb) {
      if(value !== undefined) cb(null, value)
      else waiting.push(cb)
    }
  }
}

var reboxValue = exports.reboxValue = function (value, isPrivate) {
  return isPrivate === true ? value : {
    previous: value.previous,
    sequence: value.sequence,
    author: value.author,
    timestamp: value.timestamp,
    hash: value.hash,
    content: value.cyphertext || value.content,
    signature: value.signature
  }
}

var rebox = exports.rebox = function (data, isPrivate) {
  return isPrivate === true ? data : {
    key: data.key, value: reboxValue(data.value, isPrivate),
    timestamp: data.timestamp
  }
}

exports.Format =
exports.formatStream = function (keys, values, isPrivate) {
  if('boolean' !== typeof isPrivate) throw new Error('isPrivate must be explicit')
  return Map(function (data) {
    if(data.sync) return data
    return keys && values ? rebox(data.value, isPrivate) : keys ? data.value.key : reboxValue(data.value.value, isPrivate)
  })
}

