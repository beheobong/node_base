const { v4: uuidv4 } = require('uuid')
const { AuthenticationError, ValidationError } = require('../utils/error')
const debug = require('../utils/debug')(__filename)
const postman = require('../utils/postman')

const { NODE_ENV } = process.env

const print = (level = 'info', ctx, error) => {
    const request = {
        headers: ctx.request.headers,
        params: ctx.params,
        query: ctx.request.query,
        body: ctx.request.body,
        request_id: ctx.request.headers['x-request-id']
    }

    const response = {
        headers: ctx.response.headers,
        body: ctx.body
    }

    debug[level]({
        REQUEST: request,
        RESPONSE: response,
        request_id: request.request_id,
        method: ctx.request.method,
        url: ctx.request.url,
        error: error
            ? {
                  message: error.message,
                  stack: error.stack
              }
            : error
    }).save()
    let message_maker
    if (level === 'info') {
        message_maker = postman.MessageTypes.Info
    } else {
        message_maker = postman.MessageTypes.Error
    }

    const message = message_maker({
        method: ctx.request.method,
        path: ctx.request.path,
        request_id: ctx.request.headers['x-request-id'],
        text: `REQUEST:\n${JSON.stringify(
            request,
            null,
            2
        )}\nRESPONSE:\n${JSON.stringify(response, null, 2)}`,
        sender: ctx.request.headers['sc-debugger']
    })

    postman.send(message)
}

const responseHandler = (ctx, next) => {
    const request_id = uuidv4()
    ctx.request.headers['sc-request-id'] = request_id
    ctx.response.set({ 'sc-request-id': request_id })

    return next()
        .then(() => {
            const body = {
                data: ctx.body
            }
            if (/[v V]1/.test(ctx.request.headers['sc-response-format'])) {
                body.success = true
            }
            ctx.body = body

            if (
                NODE_ENV !== 'production' &&
                ctx.request.headers['sc-debugger']
            ) {
                print('info', ctx)
            }
        })
        .catch(error => {
            let body = {}
            if (/[v V]1/.test(ctx.request.headers['sc-response-format'])) {
                body.success = false
                body.message = `${error.message}${
                    error.details && error.details.length
                        ? ` - ${error.details[0].message}`
                        : ''
                }`
                body.code = `SCLS_${error.code}`
            } else {
                if (error instanceof AuthenticationError) ctx.status = 401
                else if (error instanceof ValidationError) ctx.status = 412
                else ctx.status = 500
                body = {
                    error: {
                        code: error.code,
                        message: error.message,
                        type: error.type,
                        details: error.details
                    }
                }
            }
            ctx.body = body

            print('error', ctx, error)
        })
}

module.exports = { responseHandler }
