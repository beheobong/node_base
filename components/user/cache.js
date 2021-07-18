const ms = require('ms')
const model = require('./model')
// cache in memmory
const _in_memory = {
    data: {}, // map <uuid: {ex, payload}>
    indexs: {
        auth_id: {} // map <int, uuid>: map<mysql_id, neo4j_id>
    }
}

const TTL = '1h'
// TODO: 2. clear expried data

const getUserById = async user_id => {
    const data = _in_memory.data[user_id]
    if (data && data.ex > new Date().valueOf()) {
        return data.payload
    }

    const payload = await model.getUserById(user_id)

    if (payload) {
        _in_memory.data[user_id] = {
            payload,
            ex: new Date().valueOf() + ms(TTL)
        }
    }

    return payload
}

const getUserByIntId = async int_id => {
    const uuid = _in_memory.indexs.auth_id[int_id]
    if (uuid) {
        return getUserById(uuid)
    }

    const payload = await model.getUserByIntId(int_id)
    if (payload) {
        _in_memory.indexs.auth_id[int_id] = payload.id
        _in_memory.data[payload.id] = {
            payload,
            ex: new Date().valueOf() + ms(TTL)
        }
    }

    return payload
}

module.exports = {
    getUserById,
    getUserByIntId
}
