const fs = require('fs')
const { promisify } = require('util')
const AwsService = require('./AwsService')
// const debug = require('../utils/debug')(__filename)

const readFileAsync = promisify(fs.readFile)

const push = async ({
    name: filename,
    target_dir,
    target_id,
    target_sub,
    id,
    path
}) => {
    const s3Url = process.env.S3_BUCKET_NAME
    const path_s3_file = `${s3Url}/${target_dir}/${target_id}/${target_sub}/${id}/high`

    const data = await readFileAsync(path)
    await AwsService.uploadBufferToS3(path_s3_file, filename, data)
    await fs.unlinkSync(path)

    return `/${target_dir}/${target_id}/${target_sub}/${id}/high/${filename}`
}

module.exports = {
    push
}
