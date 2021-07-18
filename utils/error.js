/* eslint-disable max-classes-per-file */
class ValidationError extends Error {
    constructor({ code, message, details }) {
        super(message)
        this.type = 'ValidationError'
        this.code = code || 412
        if (details) this.details = details
    }
}

class AuthenticationError extends Error {
    constructor({ message }) {
        super(message)
        this.type = 'AuthenticationError'
        this.code = 401
    }
}

class UnknownError extends Error {
    constructor(error) {
        super(error.message)
        this.type = 'UnknownError'
        this.code = 500
    }
}

class DataError extends Error {
    constructor(message, code = 500) {
        super(message)
        this.type = 'DataError'
        this.code = code
    }
}

class NotFoundError extends Error {
    constructor(message, code = 404) {
        super(message)
        this.type = 'NotFoundError'
        this.code = code
    }
}

module.exports = {
    ValidationError,
    AuthenticationError,
    UnknownError,
    DataError,
    NotFoundError
}
