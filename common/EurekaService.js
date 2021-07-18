const { Eureka } = require('eureka-js-client')
const debug = require('../utils/debug')(__filename)

const { env } = process

module.exports = {
    registerWithEureka: ip => {
        const {
            EUREKA_SERVICE_NAME: service_name,
            EUREKA_SERVICE_PORT: service_port
        } = env
        const instance_id = `${service_name}:${Math.floor(
            Math.random() * 1000000
        )}`

        const client = new Eureka({
            instance: {
                instanceId: instance_id,
                app: service_name,
                hostName: ip,
                ipAddr: ip,
                port: {
                    $: service_port,
                    '@enabled': 'true'
                },
                securePort: {
                    $: '443',
                    '@enabled': 'false'
                },
                vipAddress: service_name,
                dataCenterInfo: {
                    '@class':
                        'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                    name: 'MyOwn'
                },
                registerWithEureka: true,
                fetchRegistry: true
            },
            eureka: {
                serviceUrls: {
                    default: [env.EUREKA_SERVICE_URL_DEFAULTZONE]
                }
            }
        })
        client.logger.level('debug')

        client.start(error => {
            debug.error(error)
            const instances = client.getInstancesByAppId(
                service_name.toUpperCase()
            )
            debug.info(
                `Eureka instance info:\n${JSON.stringify(instances, null, 2)}`
            )
            debug.log(error || 'service registered')
        })

        function exitHandler(options, exitCode) {
            if (exitCode || exitCode === 0) debug.log(exitCode)
            if (options.exit) {
                client.stop()
            }
        }

        client.on('deregistered', () => {
            debug.log('after deregistered')
            process.exit()
        })

        client.on('started', () => {
            debug.log(`eureka service  ${env.EUREKA_SERVICE_URL_DEFAULTZONE}`)
        })

        client.on('error', error => {
            debug.error(error)
        })

        process.on('SIGINT', exitHandler.bind(null, { exit: true }))
    }
}
