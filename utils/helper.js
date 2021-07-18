const {
    MAP_FILE_TYPE_DIR,
    MAP_TARGET_SUB_DIR,
    LOCAL_DIR_STORE
} = require('../configs/system')

const SUB_DIR_LIST = Object.values(MAP_TARGET_SUB_DIR)
SUB_DIR_LIST.push(MAP_FILE_TYPE_DIR.image)

const getMultipleUrl = url => {
    if (!url) {
        return null
    }

    const baseUrl = process.env.S3_BASE_URL
    const high_path = baseUrl + url
    const medium_path = high_path.replace('high', 'medium')
    const low_path = high_path.replace('high', 'low')

    return {
        high: high_path,
        medium: medium_path,
        low: low_path
    }
}

const getSigleUrl = url => {
    if (!url) {
        return null
    }

    return process.env.S3_BASE_URL + url
}

const getFileName = url => {
    if (!url) {
        return ''
    }
    const arr_str = url.split('/')

    return arr_str.pop().replace(`${LOCAL_DIR_STORE}_`, '')
}

const formatResponse = arr_url => {
    if (arr_url.length === 0) {
        return []
    }

    const response = []

    arr_url.forEach(({ type, path }) => {
        const arr_str = path.split('/')

        response.push({
            target_id: arr_str[2],
            media_id: arr_str[4],
            type,
            path,
            full_path: SUB_DIR_LIST.includes(arr_str[3])
                ? getMultipleUrl(path)
                : getSigleUrl(path)
        })
    })

    return response
}

module.exports = {
    getMultipleUrl,
    getSigleUrl,
    getFileName,
    formatResponse
}
