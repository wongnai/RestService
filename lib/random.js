let crypto = require(`crypto`)

function hex(len) {
  return crypto.randomBytes(Math.ceil(len / 2))
    .toString(`hex`)
    .slice(0, len)
}

module.exports = { hex }
