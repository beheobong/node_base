const environment = process.env.NODE_ENV || 'dev'
require('dotenv').config({ path: `${environment}.env` })
const http = require('http')
const Promise = require('bluebird')
const colors = require('colors')
const os = require('os')

const config = require('./configs/app')
const app = require('./app')
const { checkConnections } = require('./connections')
const { registerWithEureka } = require('./common/EurekaService')
const debug = require('./utils/debug')(__filename)

const { env } = process

const print = console
const networks = os.networkInterfaces()
const ip = env.IP_ADDRESS || networks.eth0[0].address

debug.info(
    'env ip:',
    env.IP_ADDRESS,
    'os ip:',
    networks.eth0[0].address,
    'ip:',
    ip
)

const preload = async (count = 0) => {
    if (count === 10) {
        throw new Error(`There's a db not be connected`)
    }

    const result = await checkConnections()
    let isOk = true
    Object.keys(result).forEach(dbms => {
        if (result[dbms].connected) {
            print.log(colors.green('Connected to'), colors.blue(dbms))
        } else {
            if (count === 9) {
                print.error('Cannot connect to', dbms, result[dbms].error)
            } else {
                print.log(
                    colors.green('waiting'),
                    'for connect to',
                    colors.blue(dbms)
                )
            }
            isOk = false
        }
    })

    if (!isOk) {
        await Promise.delay(1000)

        return preload(count + 1)
    }

    return true
}

preload()
    .then(() => {
        const server = http.createServer(app.callback())

        server.listen(config.port, () => {
            print.info(`Server's listening on port ${config.port}`)
            if (['staging', 'production'].includes(process.env.NODE_ENV)) {
                registerWithEureka(ip)
            }
        })
    })
    .catch(err => {
        print.error(err)
        process.exit(1)
    })
