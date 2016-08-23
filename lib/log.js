let bunyan = require(`bunyan`)
let log = null

let getOptions = () => {
  return {
    name: `bff`,
    streams: [{
      level: `info`,
      stream: process.stdout,
    }],
    serializers: {
      req: bunyan.stdSerializers.req
    },
    level: `fatal`,
  }
}

if(!log) {
  log = bunyan.createLogger(getOptions())
}

module.exports = log
