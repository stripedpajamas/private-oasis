const {
  button,
  form,
  p,
  input
} = require('hyperaxe')

const template = require('./components/template')

module.exports = () => {
  return template(
    form({ action: '/login', method: 'post' },
      p({ innerHTML: 'Enter password to access Oasis' }),
      input({ name: 'password', autofocus: true, required: true, type: 'password' }),
      button({
        type: 'submit'
      }, 'login'))
  )
}
