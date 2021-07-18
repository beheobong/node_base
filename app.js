require('dotenv').config({ path: '.env' })

const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const { v4: uuidv4 } = require('uuid')
const koaBody = require('koa-body')
const koaSwagger = require('koa2-swagger-ui')
const serve = require('koa-static')
const config = require('./configs/app')
const { LOCAL_DIR_STORE } = require('./configs/system')
const router = require('./routes')
const { responseHandler } = require('./middleware/response-handler')

const app = new Koa()
const { API_PROTOCOL, API_DOMAIN, API_BASE_PATH, BODY_LIMIT } = process.env

app.use(config.corsOrigin ? cors({ origin: config.corsOrigin }) : cors())
app.use(serve('.'))
app.use(
    koaSwagger({
        routePrefix: '/docs/swagger',
        swaggerOptions: {
            url: `${API_PROTOCOL}://${API_DOMAIN}${API_BASE_PATH}/docs/swagger.yaml`
        }
    })
)

app.use(
    koaBody({
        multipart: true,
        formidable: {
            uploadDir: `${__dirname}/${LOCAL_DIR_STORE}`, // directory where files will be uploaded
            keepExtensions: true, // keep file extension on upload
            multiples: true
        },
        urlencoded: true,
        formLimit: BODY_LIMIT,
        jsonLimit: BODY_LIMIT
    })
)
app.use(bodyParser())
app.use(responseHandler)
app.use(async (ctx, next) => {
    // add request id
    let request_id = ctx.request.headers['x-request-id'] || ctx.request.id
    if (!request_id) {
        request_id = ctx.request.id || uuidv4()
        ctx.request.id = request_id
        ctx.request.headers['x-request-id'] = request_id
        ctx.response.set({ 'x-request_id': request_id })
    }

    return next()
})

app.use(router.routes())

module.exports = app
