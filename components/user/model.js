const { neo4jExec } = require('../../connections').neo4j

const getUserById = async id => {
    const cypher = `
        MATCH (user:User {id: $id})
        RETURN properties(user) as user
    `
    const result = await neo4jExec(cypher, { id })
    if (result.records.length === 0) return null

    return result.records[0].get('user')
}

const getUserByIntId = async int_id => {
    const cypher = `
        MATCH (user:User {int_id: $int_id})
        RETURN user
    `
    const result = await neo4jExec(cypher, { int_id })
    if (result.records.length === 0) return null

    return result.records[0].get('user').properties
}

module.exports = {
    getUserById,
    getUserByIntId
}
