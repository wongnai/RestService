let Promise = require(`bluebird`)
let RequestAsync = require(`./restasync`)
let NotSuccessfulResponseError = require(`./NotSuccessfulResponseError`)
let log = require(`./log`)
let random = require(`./random`)

class RequestFactory {
  constructor(baseApi, options = {}) {
    Object.assign(this, options)
    this.baseApi = baseApi
  }

  get(path) {
    let options = this.getOptions(path, `get`)
    return doRequest(options)
  }

  post(path, body) {
    let options = this.getOptions(path, `post`, body)
    return doRequest(options)
  }

  put(path, body) {
    let options = this.getOptions(path, `put`, body)
    return doRequest(options)
  }

  patch(path, body) {
    let options = this.getOptions(path, `patch`, body)
    return doRequest(options)
  }

  delete(path) {
    let options = this.getOptions(path, `delete`)
    return doRequest(options)
  }

  getOptions(path, method, body = {}) {
    let result = {
      url: `${this.baseApi}${path}`,
      method: method,
      timeout: 10000,
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
}

let doRequest = (options) => {
  let id = random.hex(6)
  log.debug(`[%s] Sending request: %j`, id, options)
  return RequestAsync.request(options)
    .tap(log.debug.bind(log, `[%s] Response: %j`, id))
    .then(checkStatusCode)
    .then(obj => obj.body)
}

let checkStatusCode = (res) => {
  return Promise.try(() => {
    if (res.statusCode >= 400) {
      throw new NotSuccessfulResponseError(res.body)
    }
    return res
  })
}

module.exports = RequestFactory
