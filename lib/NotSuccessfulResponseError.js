'use strict'

class NotSuccessfulResponseError extends Error {
  constructor(responseBody) {
    super(responseBody.message)
    this.isOperational = true
    this.body = responseBody
  }
}

module.exports = NotSuccessfulResponseError
