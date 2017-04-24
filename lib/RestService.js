'use strict'
let _ = require(`lodash`)
let RequestFactory = require(`./RequestFactory`)
let RequestFactoryMock = require(`./RequestFactoryMock`)

const clientType = {}
const defaultHeaderList = []
const RestClient = {}

function filterHeader(headers, type) {
  if (!headers && type.headers.list.length === 0) {
    return headers
  }
  const whiteList = type.headers.whiteList.concat(defaultHeaderList)
  let tmp = _.pick(headers, whiteList)

  let uniqueHeaders = _.reduce(type.headers.list, (result, value) => {
    Object.assign(result, value)
    return result
  }, {})

  uniqueHeaders = _.reduce(uniqueHeaders, (result, value, key) => {
      if(_.isFunction(value)) {
        Object.assign(result, {[key]: value()})
      } else {
        result[key] = value
      }
      return result
    }, {})

  Object.assign(tmp, uniqueHeaders)

  return tmp
}

function reset() {
  for (let key in RestClient) {
    delete RestClient[key]
  }
}

function init(ref) {
  let clients = ref.clients
  let defaultHeaders = ref.defaultHeaders || []
  if (!clients) {
    throw new Error(`Cannot init RestClient, clients property is required.`)
  }
  if (!_.isArray(defaultHeaders) || !defaultHeaders.every(element => _.isString(element))) {
    throw new Error(`defaultHeaders should be array, and each element should be a string!`)
  }
  Object.assign(defaultHeaderList, defaultHeaders)

  clients.forEach(register)
}

function register(ref) {
  let headers = ref.headers || []
  let url = ref.url
  let type = ref.type
  let interceptor = ref.interceptor
  let timeout = ref.timeout
  if (!_.isArray(headers)) {
    throw new Error(`headers should be an array!`)
  }
  if (!_.isString(type) || !_.isString(url)) {
    throw new Error(`type and url should be a string!`)
  }
  if(interceptor) {
    if (!interceptor || !_.isPlainObject(interceptor)) {
      throw new Error(`interceptor is not an object or, interceptor.success or interceptor.error are undefined.`)
    }
    if(!_.every(interceptor, element => _.isFunction(element))) {
      throw new Error(`interceptor property is not a function.`)
    }
  }

  let currentType = {
    url,
    headers: {
      whiteList: _.filter(headers, obj => _.isString(obj)),
      list: _.filter(headers, obj => _.isPlainObject(obj))
    }
  }

  RestClient[type] = function(req) {
    req = req || {}
    let headers = req.headers
    headers = filterHeader(headers, Object.assign({}, currentType))
    let options = _.omitBy(_.assign({
      headers: headers, 
      timeout: timeout,
    }, ref.options), _.isNil)
    return new RequestFactory(currentType.url, options, interceptor)
  }
}

function mock() {
  if (typeof jasmine === `undefined`) {
    throw new Error(`Please use mock function in jasmine test environment.`)
  }
  return new RequestFactoryMock()
}

module.exports = { init: init, reset: reset, register: register, mock: mock, RestClient: RestClient }
