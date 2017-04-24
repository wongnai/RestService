'use strict'
let Promise = require(`bluebird`)
let RequestAsync = require(`./requestasync`)
let NotSuccessfulResponseError = require(`./NotSuccessfulResponseError`)

class RequestFactory {
  constructor(baseApi, options, interceptor) {
    options = options || {}
    Object.assign(this, options)
    this.baseApi = baseApi
    this.interceptor = interceptor
  }

  get(path) {
    let options = this.getOptions(path, `get`)
    return doRequest.call(this, options)
  }

  post(path, body) {
    let options = this.getOptions(path, `post`, body)
    return doRequest.call(this, options)
  }

  put(path, body) {
    let options = this.getOptions(path, `put`, body)
    return doRequest.call(this, options)
  }

  patch(path, body) {
    let options = this.getOptions(path, `patch`, body)
    return doRequest.call(this, options)
  }

  delete(path) {
    let options = this.getOptions(path, `delete`)
    return doRequest.call(this, options)
  }

  getOptions(path, method, body) {
    body = body || {}
    let result = {
      url: `${this.baseApi}${path}`,
      method: method,
      timeout: this.timeout || 10000,
      forever: true,
    }
    if (this.headers) {
      result = Object.assign(result, { headers: this.headers })
    }
    if (body.formData) {
      result = Object.assign(result, { formData: body.formData })
    } else if (Object.keys(body).length !== 0) {
      result = Object.assign(result, { body: body, json: true })
    } else {
      result.json = true
    }
    return result
  }

  setHeaders(headers) {
    Object.assign(this.headers, headers)
  }
}

let doRequest = function(options) {
  const startTime = process.hrtime()
  doInterceptor.call(this, `before`, options)
  return RequestAsync.request(options)
    .then(r => {
      const diff = process.hrtime(startTime)
      const responseTime = (diff[0] * 1e9) + diff[1]
      r.responseTime = responseTime
      return r   
    })
    .then(checkStatusCode)
    .then(doInterceptor.bind(this, `success`, options))
    .then(obj => obj.body)
    .catch((e) => {
      doInterceptor.call(this, `error`, options, e)
      e.request = options
      throw e
    })
}

let doInterceptor = function(type, options, result) {
  if(this.interceptor && this.interceptor[type]) {
    this.interceptor[type](options, result)
  }
  return result
}

let checkStatusCode = function(res) {
  return Promise.try(() => {
    if (res.statusCode >= 400) {
      throw new NotSuccessfulResponseError(res)
    }
    return res
  })
}

module.exports = RequestFactory
