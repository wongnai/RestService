let bunyan = require(`bunyan`)
let log = null

let getOptions = () => {
  if (typeof jasmine === `undefined`) {
    return {
      name: `rest-client`,
      streams: [{
        level: `info`,
        stream: process.stdout,
    }],
      serializers: {
        req: bunyan.stdSerializers.req
      },
      level: `fatal`,
    }
  } else {
    return {
      name: `rest-client`,
      level: `fatal`,
    }
  }
}

if (!log) {
  log = bunyan.createLogger(getOptions())
}

module.exports = log
