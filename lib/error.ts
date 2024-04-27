// import util from 'util'

// function DBusError(name, message) {
//     Error.call(this, message)
//     this.message = message
//     this.dbusName = name

//     if (Error.captureStackTrace) {
//         Error.captureStackTrace(this, 'DBusError')
//     } else {
//         Object.defineProperty(this, 'stack', { value: new Error().stack })
//     }
// }

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

// DBusError.prototype.toString = function () {
//     return 'DBusError: ' + this.message
// }
