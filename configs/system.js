const RESIZE = {
    medium: 300,
    low: 150
}

const LOCAL_DIR_STORE = process.env.LOCAL_DIR_STORE || 'upload'

const MAP_FILE_TYPE_DIR = {
    image: 'images',
    file: 'files',
    audio: 'audios',
    video: 'videos'
}

const MAP_TARGET_TYPE_DIR = {
    post: 'posts',
    user: 'users',
    comment: 'comments',
    room: 'rooms'
}

const MAP_TARGET_SUB_DIR = {
    cover: 'covers',
    avatar: 'avatars'
}

module.exports = {
    RESIZE,
    LOCAL_DIR_STORE,
    MAP_FILE_TYPE_DIR,
    MAP_TARGET_TYPE_DIR,
    MAP_TARGET_SUB_DIR
}
