import EventEmitter from 'node:events'
import Bus from './Bus'
import DBusError from './DBusError'

type Callback = (...args: any) => any

export default class Interface extends EventEmitter {
    constructor(
        dbusConnection: Bus,
        serviceName: string,
        objectPath: string,
        interfaceName: string,
        object: Record<string, any>,
    ) {
        super()

        this.dbusConnection = dbusConnection
        this.serviceName = serviceName
        this.objectPath = objectPath
        this.interfaceName = interfaceName
        this.methods = {}
        this.object = object
    }

    dbusConnection: Bus
    serviceName: string
    objectPath: string
    interfaceName: string
    methods: Record<string, any>
    object: Record<string, any>

    get connected() {
        return this.dbusConnection.connected
    }

    /**
     * @param callback
     * @returns
     */
    init = (callback: Callback): Callback | undefined => {
        for (const methodName in this.object?.method) {
            console.log('[init] - ')
            this.methods[methodName] = ((method, signature) => {
                return (...args: any) => {
                    const interfaceIn = this?.object?.method?.[method]?.in
                    const dbusArgs = args.slice(0, interfaceIn?.length)
                    const restArgs = args.slice(interfaceIn?.length)

                    let methodCallback: Callback =
                        typeof restArgs?.[0] === 'function'
                            ? restArgs?.[0]
                            : restArgs?.[1] || (() => {})

                    const options =
                        typeof restArgs?.[0] === 'function'
                            ? {}
                            : restArgs?.[0] || {}

                    const timeout = options.timeout || -1
                    // const handler = this.methods[method].finish || null
                    // const error = this.methods[method].error || null

                    process.nextTick(() => {
                        if (!this.connected) {
                            methodCallback?.(
                                new Error('Bus is no longer connected'),
                            )
                            return
                        }

                        try {
                            this.dbusConnection.callMethod(
                                this.dbusConnection.connection,
                                this.serviceName,
                                this.objectPath,
                                this.interfaceName,
                                method,
                                signature,
                                timeout,
                                dbusArgs,
                                methodCallback,
                            )
                        } catch (e) {
                            methodCallback?.(e)
                        }
                    })
                }
            })(
                methodName,
                this.object['method'][methodName]['in'].join('') || '',
            )
        }

        // Initializing signal handler
        const signals = Object.keys(this?.object?.['signal'] || {})

        if (signals.length) {
            this.dbusConnection.registerSignalHandler(
                this.serviceName,
                this.objectPath,
                this.interfaceName,
                this,
                () => {
                    process.nextTick(() => callback?.())
                },
            )

            return
        }

        process.nextTick(() => callback?.())
    }

    getProperties = (callback: Callback) => {
        if (!this.connected) {
            process.nextTick(() => {
                callback?.(new Error('Bus is no longer connected'))
            })

            return
        }

        this.dbusConnection.callMethod(
            this.dbusConnection.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'GetAll',
            's',
            -1,
            [this.interfaceName],
            (err: DBusError, value: any) => {
                callback?.(err, value)
            },
        )
    }

    getProperty = (propertyName: string, callback: Callback) => {
        if (!this.connected) {
            process.nextTick(() => {
                callback?.(new Error('Bus is no longer connected'))
            })
            return
        }

        this.dbusConnection.callMethod(
            this.dbusConnection.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'Get',
            'ss',
            10000,
            [this.interfaceName, propertyName],
            (err: DBusError, value: any) => {
                callback?.(err, value)
            },
        )
    }

    setProperty = (
        propertyName: string,
        value: any,
        callback: (...arg: any) => any,
    ) => {
        if (!this.connected) {
            process.nextTick(() => {
                callback?.(new Error('Bus is no longer connected'))
            })

            return
        }

        const propSig = this.object['property'][propertyName].type

        this.dbusConnection.callMethod(
            this.dbusConnection.connection,
            this.serviceName,
            this.objectPath,
            'org.freedesktop.DBus.Properties',
            'Set',
            { type: 'ssv', concrete_type: 'ss' + propSig },
            -1,
            [this.interfaceName, propertyName, value],
            (err: DBusError) => {
                callback?.(err)
            },
        )
    }
}
