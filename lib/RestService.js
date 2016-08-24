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
  const uniqueHeaders = _.reduce(type.headers.list, (result, value, key) => {
    Object.assign(result, value)
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
  if (!_.isArray(headers)) {
    throw new Error(`headers should be an array!`)
  }
  if (!_.isString(type) || !_.isString(url)) {
    throw new Error(`type and url should be a string!`)
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
    return new RequestFactory(currentType.url, { headers: headers })
  }
}

function mock() {
  if (typeof jasmine === `undefined`) {
    throw new Error(`Please use mock function in jasmine test environment.`)
  }
  return new RequestFactoryMock()
}

module.exports = { init: init, reset: reset, register: register, mock: mock, RestClient: RestClient }
