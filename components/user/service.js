const model = require('./model')

const getUserById = user_id => {
    return model.getUserById(user_id)
}

const getUsersByArrId = arr_id => {
    return model.getUserByArrId(arr_id)
}

module.exports = {
    getUserById,
    getUsersByArrId
}
