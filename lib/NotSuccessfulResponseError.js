'use strict'
class NotSuccessfulResponseError extends Error {
  constructor(response) {
    super(response.body.message)
    this.isOperational = true
    this.body = response.body
    this.statusCode = response.statusCode
  }
}

module.exports = NotSuccessfulResponseError
