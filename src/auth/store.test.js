const test = require('ava')
const store = require('./store')

test('create / get', (t) => {
  const sid = store.createSession({ name: 'pete' })
  t.deepEqual(store.getSession(sid), { name: 'pete' })
})

test('get no session', (t) => {
  t.deepEqual(store.getSession('def'), undefined)
})

test('get undefined session', (t) => {
  t.deepEqual(store.getSession(), undefined)
})
