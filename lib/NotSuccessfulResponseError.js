'use strict'
class NotSuccessfulResponseError extends Error {
  constructor(response) {
    super()
    if (response.body) {
      this.body = response.body
      this.message = response.body.message
    } else {
      this.message = 'No message available'
    }
    this.isOperational = true
    this.statusCode = response.statusCode
  }
}

module.exports = NotSuccessfulResponseError
