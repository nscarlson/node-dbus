import EventEmitter from 'node:events'
import Bus from './bus'

export default class Interface extends EventEmitter {
    constructor(
        bus: Bus,
        serviceName: string,
        objectPath: string,
        interfaceName: string,
        object: Record<string, any>,
    ) {
        super()

        this.bus = bus
        this.serviceName = serviceName
        this.objectPath = objectPath
        this.interfaceName = interfaceName
        this.object = object
    }

    bus: Bus
    serviceName: string
    objectPath: string
    interfaceName: string
    object: Record<string, any>

    get connected() {
        return this.bus.connected
    }

    init = (callback: (...args: any) => any) => {
        // Initializing methods
        for (const methodName in this.object['method']) {
            this[methodName] = ((method, signature) => {
                return () => {
                    var allArgs = Array.prototype.slice.call(arguments)
                    var interfaceIn = this.object.method[method].in
                    var dbusArgs = allArgs.slice(0, interfaceIn.length)
                    var restArgs = allArgs.slice(interfaceIn.length)
                    var options = restArgs?.[0] || {}
                    var callback = restArgs[1]

                    if (typeof options === 'function') {
                        // No options were specified; only a callback.
                        callback = options
                        options = {}
                    }

                    if (!callback) {
                        callback = () => {}
                    }

                    const timeout = options.timeout || -1
                    const handler = this[method].finish || null
                    const error = this[method].error || null

                    process.nextTick(() => {
                        if (!this.connected) {
                            callback(new Error('Bus is no longer connected'))
                            return
                        }

                        try {
                            this.bus.callMethod(
                                this.bus.connection,
                                this.serviceName,
                                this.objectPath,
                                this.interfaceName,
                                method,
                                signature,
                                timeout,
                                dbusArgs,
                                callback,
                            )
                        } catch (e) {
                            callback(e)
                        }
                    })
                }
            })(
                methodName,
                this.object['method'][methodName]['in'].join('') || '',
            )
        }

        // Initializing signal handler
        var signals = Object.keys(this.object['signal'])
        if (signals.length) {
            this.bus.registerSignalHandler(
                this.serviceName,
                this.objectPath,
                this.interfaceName,
                this,
                () => {
                    if (callback) {
                        process.nextTick(callback)
                    }
                },
            )

            return
        }

        if (callback) {
            process.nextTick(callback)
        }
    }

    getProperties = (callback: (...args: any) => any) => {
        if (!this.connected) {
            process.nextTick(function () {
                callback(new Error('Bus is no longer connected'))
            })
            return
        }

        this.bus.callMethod(
            this.bus.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'GetAll',
            's',
            -1,
            [this.interfaceName],
            (err: any, value) => {
                if (callback) {
                    callback(err, value)
                }
            },
        )
    }

    getProperty = (propertyName: string, callback: (...args: any) => any) => {
        if (!this.connected) {
            process.nextTick(function () {
                callback(new Error('Bus is no longer connected'))
            })
            return
        }

        this.bus.callMethod(
            this.bus.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'Get',
            'ss',
            10000,
            [this.interfaceName, propertyName],
            (err: any, value: any) => {
                if (callback) {
                    callback(err, value)
                }
            },
        )
    }

    setProperty = (
        propertyName: string,
        value: any,
        callback: (...arg: any) => any,
    ) => {
        if (!this.connected) {
            process.nextTick(function () {
                callback(new Error('Bus is no longer connected'))
            })

            return
        }

        var propSig = this.object['property'][propertyName].type

        this.bus.callMethod(
            this.bus.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'Set',
            { type: 'ssv', concrete_type: 'ss' + propSig },
            -1,
            [this.interfaceName, propertyName, value],
            (err: any) => {
                if (callback) {
                    callback(err)
                }
            },
        )
    }
}
