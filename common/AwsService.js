const AWS = require('aws-sdk')

const ep = new AWS.Endpoint(process.env.S3_CLOUD)
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_PRIVATE_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: ep
})

const uploadImageToS3 = (folder, filename, data) => {
    const buf = Buffer.from(
        data.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
    )
    const params = {
        Bucket: folder,
        Key: filename,
        Body: buf,
        ACL: 'public-read'
    }

    return new Promise((resolve, reject) => {
        s3.putObject(params, (error, res) => {
            if (error) {
                reject(error)
            }
            resolve(res)
        })
    })
}

const uploadBufferToS3 = (folder, filename, data) => {
    const params = {
        Bucket: folder,
        Key: filename,
        Body: data,
        ACL: 'public-read'
    }

    return new Promise((resolve, reject) => {
        s3.putObject(params, (error, res) => {
            if (error) {
                reject(error)
            }
            resolve(res)
        })
    })
}

module.exports = {
    uploadImageToS3,
    uploadBufferToS3
}
