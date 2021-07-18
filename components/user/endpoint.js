// const debug = require('../../utils/debug')(__filename)
const Router = require('koa-router')

const handlers = require('./handler')

const prefix = '/users'
const router = new Router({ prefix })

router.get('/:user_id', handlers.getUserById) // Get a user by id

module.exports = router
