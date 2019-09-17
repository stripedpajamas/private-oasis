const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { ulid } = require('ulid')

const COOKIE_NAME = 'private-oasis'
const DEFAULT_ATTEMPTS = 3
const DEFAULT_COOLOFF = 5 * 60 * 1000

function withAuth (getPwd = () => { throw new Error('no password getter') }) {
  const state = {
    remainingAttempts: DEFAULT_ATTEMPTS,
    authenticated: false,
    session: null,
    cooloff: null
  }

  function createSession () {
    state.session = ulid()
    state.authenticated = true
    return state.session
  }

  function noteFailure () {
    clearTimeout(state.cooloff)
    state.authenticated = false
    state.session = null
    state.remainingAttempts--
    if (state.remainingAttempts < 1) {
      state.cooloff = setTimeout(() => {
        state.remainingAttempts = DEFAULT_ATTEMPTS
      }, DEFAULT_COOLOFF)
    }
  }

  return {
    authenticate: () => async (ctx) => {
      const { password } = ctx.request.body
      if (state.remainingAttempts < 1) {
        ctx.status = 401
        ctx.body = 'Unauthorized'
        return
      }
      if (!bcrypt.compare(getPwd(), password)) {
        noteFailure()
        ctx.status = 401
        ctx.body = 'Unauthorized'
        return
      }
      const session = createSession()
      ctx.cookies.set(COOKIE_NAME, session)
      ctx.status = 200
    },
    session: (ctx, next) => {
      const cookie = ctx.cookies.get(COOKIE_NAME)
      if (!state.authenticated || cookie.length !== session.length) {
        ctx.redirect('/login')
        return
      }
      if (!crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(session))) {
        ctx.redirect('/login')
        return
      }
      return next()
    }
  }
}

module.exports = withAuth
