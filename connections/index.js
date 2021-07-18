const debug = require('../utils/debug')(__filename)
const neo4j = require('./neo4j')
const redis = require('./redis')

process.on('SIGINT', () => {
    Promise.all([
        redis.getConnection().disconnect(),
        redis.getPubSub().disconnect(),
        neo4j.getConnection().close()
    ])
        .then(() => process.exit(0))
        .catch(error => {
            debug.critical(error)
            process.exit(1)
        })
})

const checkConnections = async () => {
    return {
        neo4j: await neo4j
            .getConnection()
            .verifyConnectivity()
            .then(() => ({
                connected: true
            }))
            .catch(error => ({ connected: false, error: error.message })),
        redis: await Promise.resolve(redis.getConnection().status)
            .then(result =>
                result === 'ready'
                    ? { connected: true }
                    : { connected: false, error: result }
            )
            .catch(error => ({ connected: false, error: error.message }))
    }
}

module.exports = {
    neo4j,
    redis,
    checkConnections
}
