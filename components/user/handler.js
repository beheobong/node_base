const model = require('./model')

const getUserById = async ctx => {
    const { user_id } = ctx.params
    ctx.body = await model.getUserById(user_id)
}

module.exports = {
    getUserById
}
