const _ = require('lodash')
const { ValidationError } = require('../utils/error')

function validate(schemas, handleLogging) {
    return (ctx, next) => {
        const { body } = ctx.request
        const { params, query } = ctx

        const data = {
            body,
            params,
            query
        }

        const positions = Object.keys(schemas) // [body, params, query]
        if (schemas.headers) {
            data.headers = _.pick(
                ctx.request.headers,
                Object.keys(schemas.headers)
            )
        }

        for (let i = 0; i < positions.length; i += 1) {
            const part = positions[i]
            const schema =
                typeof schemas[part] === 'function'
                    ? schemas[part](ctx)
                    : schemas[part]

            const { error } = schema.validate(data[part])
            const details = !error || error.details

            if (error) {
                if (handleLogging) {
                    handleLogging(error, ctx)
                }

                throw new ValidationError({
                    message: `Missing or invalid params at${part}`,
                    details
                })
            }
        }

        return next()
    }
}

module.exports = {
    validate
}
