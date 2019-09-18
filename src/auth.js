const crypto = require('crypto')
const bcrypt = require('bcrypt')
const debug = require('debug')('oasis')

const COOKIE_NAME = 'private-oasis'
const DEFAULT_ATTEMPTS = 3
const DEFAULT_COOLOFF = 5 * 60 * 1000
const DEFAULT_LOGIN_ROUTE = '/login'

function withAuth (userConfig = {}) {
  const config = Object.assign({
    attempts: DEFAULT_ATTEMPTS,
    cooloff: DEFAULT_COOLOFF,
    cookieName: COOKIE_NAME,
    loginRoute: DEFAULT_LOGIN_ROUTE
  }, userConfig)

  if (typeof config.getPwdHash !== 'function' || typeof config.getPwdHash() !== 'string') {
    throw new Error('need valid password getter')
  }

  const state = {
    remainingAttempts: config.attempts,
    authenticated: false,
    session: null,
    cooloffTimer: null
  }

  function createSession () {
    debug('Creating new session')
    state.session = crypto.randomBytes(32).toString('hex')
    state.authenticated = true
    return state.session
  }

  function noteFailure () {
    debug('Failure to authenticate')
    clearTimeout(state.cooloffTimer)
    state.authenticated = false
    state.session = null
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
      const session = createSession()
      ctx.cookies.set(config.cookieName, session)
      ctx.redirect('/')
    },
    session: async (ctx, next) => {
      const cookie = ctx.cookies.get(config.cookieName)
      if (!state.authenticated || cookie.length !== state.session.length) {
        ctx.redirect(config.loginRoute)
        return
      }
      if (!crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(state.session))) {
        ctx.redirect(config.loginRoute)
        return
      }

      return next()
    }
  }
}

module.exports = withAuth
