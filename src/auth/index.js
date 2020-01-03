const bcrypt = require('bcrypt')
const debug = require('debug')('oasis')
const store = require('./store')

const COOKIE_NAME = 'private-oasis'
const DEFAULT_ATTEMPTS = 3
const DEFAULT_COOLOFF = 5 * 60 * 1000
const DEFAULT_LOGIN_ROUTE = '/login'

function withAuth (userConfig = {}) {
  const config = Object.assign({
    attempts: DEFAULT_ATTEMPTS,
    cooloff: DEFAULT_COOLOFF,
    cookieName: COOKIE_NAME,
    loginRoute: DEFAULT_LOGIN_ROUTE,
    getPwdHash: null,
    store
  }, userConfig)

  if (typeof config.getPwdHash !== 'function' || typeof config.getPwdHash() !== 'string') {
    throw new Error('need valid password getter')
  }

  const state = {
    remainingAttempts: config.attempts,
    cooloffTimer: null
  }

  function noteFailure () {
    debug('Failure to authenticate')
    clearTimeout(state.cooloffTimer)
    state.remainingAttempts--
    if (state.remainingAttempts < 1) {
      debug('All authentication attempts used; cooling off')
      state.cooloffTimer = setTimeout(() => {
        debug('Resetting authentication attempts')
        state.remainingAttempts = config.attempts
      }, config.cooloff)
    }
  }

  return {
    authenticate: async (ctx) => {
      function fail () {
        ctx.status = 401
        ctx.body = 'Unauthorized'
      }
      const { password } = ctx.request.body
      if (state.remainingAttempts < 1 || !password) {
        fail()
        return
      }
      const authenticated = await bcrypt.compare(password, config.getPwdHash())
      if (!authenticated) {
        noteFailure()
        fail()
        return
      }
      const sessionId = config.store.createSession({}) // empty data
      ctx.cookies.set(config.cookieName, sessionId)
      ctx.redirect('/')
    },
    session: async (ctx, next) => {
      const sid = ctx.cookies.get(config.cookieName)
      if (!sid) {
        debug('Request without session ID in cookie, redirecting to login route')
        ctx.redirect(config.loginRoute)
        return
      }
      if (!config.store.getSession(sid)) {
        debug('No session found, redirecting to login route')
        ctx.redirect(config.loginRoute)
        return
      }

      return next()
    }
  }
}

module.exports = withAuth
