const Router = require('koa-router')

const controller = require('./controller')

const prefix = '/'
const router = new Router({ prefix })
const schema = require('./schema')
const { validate } = require('../../middleware/validator')

router.post('/', validate(schema.upload_media), controller.uploadMedia) // Get attachments of a room

module.exports = router
