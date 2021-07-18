const { IncomingWebhook } = require('@slack/webhook')
const { name: app_name } = require('../package.json')

const level = {
    error: 'error',
    info: 'info'
}

const { SLACK_WEBHOOK_URL, NODE_ENV, CONAN_URL, CONAN_LOG_APP } = process.env // PUT YOUR WEBHOOK URL HERE

// Initialize
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)

// eslint-disable-next-line no-unused-vars
const Message = ({ method, path, request_id, sender, type, error }) => {
    const rid = CONAN_URL
        ? `<${CONAN_URL}/logs?app=${CONAN_LOG_APP}&request_id=${request_id}|${request_id}>`
        : request_id
    this.username = app_name.toLowerCase()
    this.icon_emoji = ':film_projector:' // User icon, you can also use custom icons here
    this.title = type
    this.blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:film_projector: ${app_name.toLowerCase()}`,
                emoji: true
            }
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `:desktop_computer: *${NODE_ENV || 'development'}*`
                }
            ]
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text:
                    '```' +
                    `API:\t${method} ${path}\n` +
                    `Err:\t${error ? error.type : ''}\n` +
                    `RID:\t${rid}` +
                    '```'
            }
        },
        {
            type: 'divider'
        }
    ]

    return this
}

const MessageTypes = {
    Error: ({ text, request_id, method, path, sender, error }) =>
        Message({
            text,
            request_id,
            method,
            path,
            sender,
            type: level.error,
            error
        }),
    Info: ({ text, request_id, method, path, sender }) =>
        Message({ text, request_id, method, path, sender, type: level.info })
}

/**
 * Handles the actual sending request.
 * We're turning the https.request into a promise here for convenience
 * @param webhookURL
 * @param strMessage
 * @return {Promise}
 */
async function send(message) {
    // make sure the incoming message body can be parsed into valid JSON
    const result = await webhook.send(message).catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
    })

    return result
}

module.exports = {
    send,
    MessageTypes
}
