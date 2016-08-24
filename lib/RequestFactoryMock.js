'use strict'
let Promise = require(`bluebird`)
let _ = require(`lodash`)

let MockState = Object.freeze({
  CREATED: 0,
  BUILD: 1,
})

let methods = [`get`, `post`, `put`, `patch`, `delete`]

class RequestFactoryMock {
  constructor() {
    this.urlArray = []
    this.state = MockState.CREATED
  }

  get(url, data = {}) {
    return this.action(url, `get`, _.cloneDeep(data))
  }

  delete(url, data = {}) {
    return this.action(url, `delete`, _.cloneDeep(data))
  }

  post(url, data) {
    return this.action(url, `post`, _.cloneDeep(data))
  }

  put(url, data) {
    return this.action(url, `put`, _.cloneDeep(data))
  }

  patch(url, data) {
    return this.action(url, `patch`, _.cloneDeep(data))
  }

  build() {
    if (this.urlArray.length === 0) {
      throw new Error(`Please add at less one action with get, post, put, patch, or delete method before build mock.`)
    }
    this.state = MockState.BUILD
    resetObj(this)
    spyObj(this)
    return this
  }


  action(url, method, data) {
    if (this.state === MockState.CREATED) {
      this.urlArray.push({ url, method, data })
    } else {
      if (data instanceof Error) {
        return Promise.reject(data)
      }

      let result = _.find(this.urlArray, obj => {
        if (obj.url === `*`) {
          return method === obj.method
        }
        let regex = new RegExp(obj.url)
        return regex.test(url) && method === obj.method
      })

      if (!result) {
        throw new Error(`URL ${url}, Method ${method} is not found in RequestFactoryMock. Please specific path or use '*'`)
      }
      if (result.data instanceof Array) {
        let currentMethod = this[method]
        return Promise.resolve(result.data[currentMethod.calls.count() - 1])
      }

      return Promise.resolve(result.data)
    }
  }
}

let spyObj = (that) => {
  for (let method of methods) {
    spyOn(that, method).and.callThrough()
  }
}

let resetObj = (that) => {
  for (let method of methods) {
    if (that[method].calls) {
      that[method].calls.reset()
    }
  }
}

module.exports = RequestFactoryMock
