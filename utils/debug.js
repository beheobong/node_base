/* eslint-disable func-names */
/* eslint-disable func-names */
const debug = require('debug')
const path = require('path')
const os = require('os')
const winston = require('winston')
require('winston-logstash')

winston.add(winston.transports.Logstash, {
    port: process.env.LOGSTASH_PORT,
    ssl_enable: false,
    max_connect_retries: -1,
    host: process.env.LOGSTASH_HOST
})

const hostname = os.hostname()

const meta = require('../package.json')

const LEVEL = {
    LOG: 'log',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
}

function print({ level, namespace, args }) {
    const logger = debug(`${meta.name}:${level}:${namespace}`)

    logger(...args)
}
function Debug(pathFile) {
    const dirname = path.dirname(pathFile)
    const filename = path.basename(pathFile, '.js')
    const absolute = path.relative(path.join(__dirname, '..'), dirname)
    const arrDir = absolute ? absolute.split(path.sep) : []
    arrDir.push(filename)
    const namespace = arrDir.join(':')

    this.namespace = `${namespace}`
    this.args = []
}

Debug.prototype.setSubNamespace = function(sub) {
    this.namespace = `${this.namespace}:${sub}`

    return this
}

Debug.prototype.log = function(...args) {
    this.level = LEVEL.LOG
    this.args = args
    print(this)

    return this
}

Debug.prototype.info = function(...args) {
    this.level = LEVEL.INFO
    this.args = args
    print(this)

    return this
}

Debug.prototype.warn = function(...args) {
    this.level = LEVEL.WARN
    this.args = args
    print(this)

    return this
}

Debug.prototype.error = function(...args) {
    this.level = LEVEL.ERROR
    this.args = args
    print(this)

    return this
}

Debug.prototype.critical = function(...args) {
    this.level = LEVEL.CRITICAL
    this.args = args
    print(this)

    return this
}

Debug.prototype.save = function() {
    const data = {
        level: this.level,
        type: meta.name,
        hostname,
        method: this.args[0].method || 'unknow_method',
        request_id: this.args[0].request_id || 'unknow_request_id',
        url: this.args[0].url || 'unknow_url',
        namespace: this.namespace,
        message: this.args
            .map(e => {
                if (typeof e === 'object') {
                    if (Array.isArray(e)) {
                        return `[${e.toString()}]`
                    }

                    return JSON.stringify(e)
                }

                return e
            })
            .join()
    }
    this.level = LEVEL.INFO
    winston.log('info', JSON.stringify(data))
}

module.exports = pathFile => new Debug(pathFile)
