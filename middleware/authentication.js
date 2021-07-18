const debug = require('../utils/debug')(__filename)
const jwt = require('../utils/jwt')
const { AuthenticationError } = require('../utils/error')
const UserCache = require('../components/user/cache')

const authenticate = async (ctx, next) => {
    const { authorization } = ctx.request.headers
    if (!authorization) {
        const message = 'Authorization is required'
        debug.warn(message)
        throw new AuthenticationError({ message })
    }

    const [type, token] = authorization.split(' ')
    if (type !== 'Bearer' || !token) {
        const message =
            'Authorization must to be in format "Authorization: Bearer [token]"'
        debug.warn(message)
        throw new AuthenticationError({ message })
    }

    const payload = await jwt.verifyAccessToken(token)
    if (!payload) {
        debug.warn('invalid token')
        throw new AuthenticationError({ message: 'invalid token' })
    }

    const user = await UserCache.getUserByIntId(payload.id)

    if (!user) {
        const message = `User ${payload.id} not found`
        debug.warn(message)
        throw new AuthenticationError({ message })
    }

    debug.log(`valid token, user_id = ${user.id}`)
    ctx.state.user = user

    return next()
}

module.exports = {
    authenticate
}
