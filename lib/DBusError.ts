// import util from 'util'

export default class DBusError extends Error {
    constructor(name: string, message: string) {
        super(message)

        this.dbusName = name
        this.message = message

        Error.captureStackTrace(this)
    }

    dbusName
    message

    toString = () => 'DBusError: ' + this.message
}
