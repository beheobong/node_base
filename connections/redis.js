const Redis = require('ioredis')
const ms = require('ms')
const zlib = require('zlib')

const {
    redis_prefix: prefix,
    redis_prefix_global: g_prefix
} = require('../configs/app')

const { env } = process

const genModuleKey = (cluster_key, primary_key) =>
    `{${prefix}/${cluster_key}}:${primary_key}`
const genGlobalKey = (cluster_key, primary_key) =>
    `{${g_prefix}/${cluster_key}}:${primary_key}`

// redis
const getNewConnection = () => {
    const node = {
        port: env.REDIS_PORT || 6379,
        host: env.REDIS_HOST || 'localhost'
    }

    const options = {
        password: env.REDIS_PASSWORD
    }

    if (env.REDIS_MODE === 'cluster') {
        return new Redis.Cluster([node], { redisOptions: options })
    }

    // default
    options.db = env.REDIS_DB

    return new Redis(node.port, node.host, options)
}

const redis = getNewConnection()
const pubsub = getNewConnection()

/**
 * Get a caching, if not then execute a function and cache result
 * @param {object} options {key: "cache key", ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFn = async (
    rclient,
    { key, ttl = 60, json = false, compress = false },
    fn
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    let cached = await rclient.get(key)
    if (!cached) {
        const result = await fn()
        let val = json ? JSON.stringify(result) : result
        if (compress) {
            val = zlib.gzipSync(val).toString('base64')
        }
        rclient.set(key, val, 'EX', ttlInSecond)

        return result
    }

    if (compress) {
        cached = zlib.gunzipSync(Buffer.from(cached, 'base64')).toString('utf8')
    }
    if (json) {
        cached = JSON.parse(cached)
    }

    return cached
}

/**
 * Get a caching in hash, if not then execute a function and cache result
 * @param {object} options {key: "cache key", field: "cache field" ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFnH = async (
    rclient,
    { key, field, ttl = 60, json = false, compress = false },
    fn
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    const is_exists = await rclient.exists(key)
    let result = null
    if (is_exists) {
        result = await rclient.hget(key, field)
        if (result) {
            if (compress)
                result = zlib
                    .gunzipSync(Buffer.from(result, 'base64'))
                    .toString('utf8')
            if (json) result = JSON.parse(result)
        }
    }
    if (!is_exists || !result) {
        result = await Promise.resolve(fn())
        let val = json ? JSON.stringify(result) : result
        if (compress) val = zlib.gzipSync(val).toString('base64')

        rclient.hset(key, field, val)
    }
    if (!is_exists) {
        rclient.expire(key, ttlInSecond)
    }

    return result
}

/**
 * Get a caching in set, if not then execute a function and cache result
 * @param {object} options {key: "cache key", val: "cached value", ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return {number | null} return object if option json = true else return a string
 */
const cachedFnS = async (
    rclient,
    { key, val, ttl = 60, json = false, compress = false },
    fn
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    const is_exists = await rclient.exists(key)
    let result = null
    let rebuild_val = null
    if (is_exists) {
        rebuild_val = val
        rebuild_val = json ? JSON.stringify(rebuild_val) : rebuild_val
        if (compress)
            rebuild_val = zlib.gzipSync(rebuild_val).toString('base64')
        result = await rclient.sismember(key, rebuild_val)
    }
    if (!is_exists || !result) {
        rebuild_val = await Promise.resolve(fn())
        if (!rebuild_val) return 0
        rebuild_val = json ? JSON.stringify(rebuild_val) : rebuild_val
        if (compress)
            rebuild_val = zlib.gzipSync(rebuild_val).toString('base64')

        rclient.sadd(key, rebuild_val)
        result = 1
    }
    if (!is_exists) {
        rclient.expire(key, ttlInSecond)
    }

    return result
}

redis.defineCommand('flushpattern', {
    numberOfKeys: 0,
    lua: `
        local keys = redis.call('keys', ARGV[1])
        for i=1,#keys,5000 do
            redis.call('del', unpack(keys, i, math.min(i+4999, #keys)))
        end
        return keys
    `
})

const getValue = async (rclient, { key, json = false, compress = false }) => {
    let cached = await rclient.get(key)
    if (!cached) {
        return null
    }
    if (compress) {
        cached = zlib.gunzipSync(Buffer.from(cached, 'base64')).toString('utf8')
    }
    if (json) {
        cached = JSON.parse(cached)
    }

    return cached
}

const setValue = async (
    rclient,
    { key, ttl = 60, json = false, compress = false },
    value
) => {
    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }
    let val = json ? JSON.stringify(value) : value

    if (compress) val = zlib.gzipSync(val).toString('base64')

    await rclient.set(key, val, 'EX', ttlInSecond)

    return value
}

module.exports = {
    getPubSub: () => pubsub,
    getConnection: () => redis,
    getNewConnection,
    genGlobalKey,
    genModuleKey,
    cachedFn,
    cachedFnH,
    cachedFnS,
    getValue,
    setValue
}
