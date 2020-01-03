const crypto = require('crypto')

class MemoryStore {
  constructor () {
    this.sessions = null // i see u tsc
    Object.defineProperty(this, 'sessions', {
      value: new Map(),
      configurable: false,
      enumerable: true,
      writable: false
    })
  }

  createSession (data) {
    const sid = crypto.randomBytes(32).toString('hex')
    this.sessions.set(sid, data)
    return sid
  }

  getSession (sid) {
    if (!sid) {
      return
    }
    return this.sessions.get(sid)
  }
}

module.exports = new MemoryStore()
