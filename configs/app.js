const { env } = process

module.exports = {
    port: env.PORT || 3000,
    noti_service_type: env.NOTI_SERVICE_TYPE || 'SOCIAL',
    redis_prefix: env.REDIS_PREFIX || 'media',
    redis_prefix_global: env.REDIS_PREFIX_GLOBAL || 'g-social'
}
