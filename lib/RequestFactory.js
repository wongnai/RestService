let Promise = require(`bluebird`)
let RequestAsync = require(`./requestasync`)
let NotSuccessfulResponseError = require(`./NotSuccessfulResponseError`)

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
  return RequestAsync.request(options)
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
