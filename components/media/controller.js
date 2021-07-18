const {
    types: { Uuid, TimeUuid }
} = require('cassandra-driver')
const mine = require('mime-types')
const Helpers = require('../../utils/helper')
const { ValidationError } = require('../../utils/error')
// const debug = require('../../utils/debug')(__filename)
const { redis } = require('../../connections')

const rclient = redis.getConnection()

const FileService = require('../../common/FileService')
const ImageService = require('../../common/ImageService')
const VideoService = require('../../common/VideoService')
const {
    MAP_FILE_TYPE_DIR,
    MAP_TARGET_SUB_DIR,
    MAP_TARGET_TYPE_DIR
} = require('../../configs/system')

const genGlobalKey = path => redis.genGlobalKey('media', path)

const SUB_DIR_LIST = Object.values(MAP_TARGET_SUB_DIR)
SUB_DIR_LIST.push(...Object.values(MAP_FILE_TYPE_DIR))

const uploadMedia = async ctx => {
    const { id: user_id } = ctx.state.user
    let { target_id } = ctx.request.body
    const { target_sub, target_type } = ctx.request.body
    const target_dir = MAP_TARGET_TYPE_DIR[target_type] // map post => posts, ...
    if (target_type === 'user') {
        target_id = user_id
    }

    if (!target_id) {
        // post & comment id types are TimeUuid
        if (
            [MAP_TARGET_TYPE_DIR.post, MAP_TARGET_TYPE_DIR.comment].includes(
                target_dir
            )
        ) {
            target_id =
                target_id ||
                TimeUuid.fromDate(new Date(), Math.floor(Math.random() * 10000))
        } else {
            target_id = Uuid.random()
        }
    }

    let mediaUpload = ctx.request.files.media

    if (!mediaUpload) {
        throw new ValidationError({
            message: `File upload is required.`
        })
    }

    mediaUpload = mediaUpload.path ? [mediaUpload] : mediaUpload

    const promises = mediaUpload.map(async e => {
        const target_sub_dir = MAP_TARGET_SUB_DIR[target_sub]

        // get type
        let type = mine.lookup(e.name)
        if (/^image\/.*/.test(type)) type = 'IMAGE'
        else if (/^video\/.*/.test(type)) type = 'VIDEO'
        else if (/^audio\/.*/.test(type)) type = 'AUDIO'
        else type = 'FILE'

        let ratio
        if (type === 'IMAGE') {
            ratio = await ImageService.getRatio(e.path)
        }
        const redis_payload = {
            ...ratio,
            origin_name: e.name,
            size: e.size
        }

        const element_upload = {
            type,
            target_dir,
            target_sub: target_sub_dir || MAP_FILE_TYPE_DIR[type.toLowerCase()],
            target_id,
            id: Uuid.random(),
            path: e.path,
            name: Helpers.getFileName(e.path)
        }

        let upload_service
        switch (element_upload.type) {
            case 'IMAGE':
                upload_service = ImageService
                break
            case 'VIDEO':
                upload_service = VideoService
                break
            default:
                upload_service = FileService
        }

        const path = await upload_service.push(element_upload)

        // save into redis to reuse in other modules
        if (target_type !== 'user') {
            await rclient.set(
                genGlobalKey(path),
                JSON.stringify(redis_payload),
                'EX',
                3599
            ) // 0h
        }

        return {
            type: element_upload.type,
            path
        }
    })

    const data_upload = await Promise.all(promises)
    ctx.body = Helpers.formatResponse(data_upload)
    // ctx.body = uploads
}

module.exports = {
    uploadMedia
}
