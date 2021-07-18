const Joi = require('@hapi/joi')

const { MAP_TARGET_TYPE_DIR } = require('../../configs/system')
const { MAP_TARGET_SUB_DIR } = require('../../configs/system')

const target_type = Object.keys(MAP_TARGET_TYPE_DIR)
const target_sub_list = Object.keys(MAP_TARGET_SUB_DIR)

const upload_media = {
    body: ctx => {
        const target_sub =
            ctx.request.body && ctx.request.body.target_sub
                ? Joi.string().valid(...target_sub_list)
                : Joi.string().optional()

        return Joi.object({
            target_type: Joi.string()
                .valid(...target_type)
                .required(),
            target_sub,
            target_id: Joi.when('target_type', {
                is: MAP_TARGET_TYPE_DIR.room,
                then: Joi.string()
                    .guid()
                    .required(),
                otherwise: Joi.string().guid()
            })
        })
    }
}

module.exports = {
    upload_media
}
