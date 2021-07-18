const Neo4j = require('neo4j-driver')

const { env } = process
// neo4j

const neo4j = Neo4j.driver(
    env.NEO4J_CONNECTION_URL,
    Neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
    {
        maxConnectionPoolSize: env.NEO4J_MAX_CONNECTION_POOL_SIZE || 2000
    }
)

const neo4jExec = async (cypher, params) => {
    const session = neo4j.session()
    try {
        return await session.run(cypher, params)
    } finally {
        session.close()
    }
}

module.exports = {
    getConnection: () => neo4j,
    neo4jExec
}
