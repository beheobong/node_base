const fs = require('fs')
const { promisify } = require('util')
const Jimp = require('jimp')
const AwsService = require('./AwsService')
const debug = require('../utils/debug')(__filename)

const readFileAsync = promisify(fs.readFile)
const { RESIZE } = require('../configs/system')

const resizeImage = (path, size) => {
    return new Promise((resolve, reject) => {
        Jimp.read(path).then(lenna => {
            lenna
                .resize(size, Jimp.AUTO)
                .quality(100)
                .getBase64(Jimp.AUTO, (err, data) => {
                    if (err) reject(err)
                    resolve(data)
                })
        })
    })
}
const push = async ({
    name: filename,
    target_dir,
    target_id,
    target_sub,
    id,
    path
}) => {
    // resize
    const s3Url = process.env.S3_BUCKET_NAME

    const high_path = `${s3Url}/${target_dir}/${target_id}/${target_sub}/${id}/high`
    const medium_path = `${s3Url}/${target_dir}/${target_id}/${target_sub}/${id}/medium`
    const low_path = `${s3Url}/${target_dir}/${target_id}/${target_sub}/${id}/low`

    const data = await readFileAsync(path)

    // resize
    const [medium_data, low_data] = await Promise.all([
        resizeImage(path, RESIZE.medium),
        resizeImage(path, RESIZE.low)
    ])
        .then(result => {
            return [result[0], result[1]]
        })
        .catch(error => {
            debug.error(error).save()

            return [data, data]
        })
    // upload image
    await Promise.all([
        AwsService.uploadBufferToS3(high_path, filename, data),
        AwsService.uploadImageToS3(medium_path, filename, medium_data),
        AwsService.uploadImageToS3(low_path, filename, low_data)
    ])

    // delete file in local
    await fs.unlinkSync(path)

    return `/${target_dir}/${target_id}/${target_sub}/${id}/high/${filename}`
}

const getRatio = async path => {
    const image = await Jimp.read(path)

    return {
        width: image.bitmap.width,
        height: image.bitmap.height,
        ratio: (image.bitmap.width / image.bitmap.height).toFixed(3)
    }
}
module.exports = {
    push,
    getRatio
}
