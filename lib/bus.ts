import EventEmitter from 'node:events'
import Interface from './interface'
import DBusError from './error'
import DBus from './dbus'

type BusName = 'session' | 'system'
type Callback = (...args: any) => any

export default class Bus extends EventEmitter {
    constructor(_dbus: any, dbus: DBus, busName: BusName) {
        super()

        this._dbus = _dbus
        this.DBus = DBus
        this.busName = busName
        this.signalHandlers = {}
        this.signalEnable = false

        switch (busName) {
            case 'system':
                this.connection = _dbus.getBus(0)
                break

            case 'session':
                this.connection = _dbus.getBus(1)
                break
        }

        this.on(
            'signal',
            (
                uniqueBusName: string,
                sender: any,
                objectPath: string,
                interfaceName: string,
                signalName: string,
                args: any,
            ) => {
                if (
                    objectPath == '/org/freedesktop/DBus/Local' &&
                    interfaceName == 'org.freedesktop.DBus.Local' &&
                    signalName == 'Disconnected'
                ) {
                    this.reconnect()

                    return
                }

                const signalHash = objectPath + ':' + interfaceName

                if (this.signalHandlers[signalHash]) {
                    const newArgs = [signalName].concat(args)
                    const interfaceObj = this.signalHandlers[signalHash]

                    interfaceObj.emit(newArgs)
                }
            },
        )

        // Register signal handler of this connection
        this.DBus.signalHandlers[this.connection.uniqueName] = this
        this.DBus.enableSignal()

        this.interfaces = {}
    }
    _dbus
    connection: any
    DBus: any
    busName: 'system' | 'session'
    signalHandlers: Record<string, any>
    signalEnable: boolean
    interfaces: Record<string, any>

    get connected() {
        return this.connection !== null
    }

    disconnect = (callback?: Callback) => {
        delete this.DBus.signalHandlers[this.connection.uniqueName]

        this._dbus.releaseBus(this.connection)

        this.connection = null

        if (callback) {
            process.nextTick(callback)
        }
    }

    reconnect = (callback?: Callback) => {
        if (this.connection) {
            delete this.DBus.signalHandlers[this.connection.uniqueName]

            this._dbus.releaseBus(this.connection)
        }

        switch (this.busName) {
            case 'system':
                this.connection = this._dbus.getBus(0)
                break

            case 'session':
                this.connection = this._dbus.getBus(1)
                break
        }

        this.DBus.signalHandlers[this.connection.uniqueName] = this

        // Reregister signal handler
        for (const hash in this.interfaces) {
            const iface = this.interfaces[hash]

            this.registerSignalHandler(
                iface.serviceName,
                iface.objectPath,
                iface.interfaceName,
                iface,
            )
        }

        if (callback) {
            process.nextTick(callback)
        }
    }

    introspect = (
        serviceName: string,
        objectPath: string,
        callback: Callback,
    ) => {
        if (!this.connected) {
            process.nextTick(() => {
                callback(new Error('Bus is no longer connected'))
            })

            return
        }

        // Getting scheme of specific object
        this.callMethod(
            this.connection,
            serviceName,
            objectPath,
            'org.freedesktop.DBus.Introspectable',
            'Introspect',
            '',
            10000,
            [],
            (err: DBusError, introspect: any) => {
                const obj = this._parseIntrospectSource(introspect)

                if (!obj) {
                    if (callback) {
                        callback(new Error('No introspectable'))
                    }
                    return
                }

                if (callback) {
                    callback(err, obj)
                }
            },
        )
    }

    _parseIntrospectSource = (source: any) => {
        return this._dbus.parseIntrospectSource.apply(this, [source])
    }

    getInterface = (
        serviceName: string,
        objectPath: string,
        interfaceName: string,
        callback: Callback,
    ) => {
        if (
            this.interfaces[
                serviceName + ':' + objectPath + ':' + interfaceName
            ]
        ) {
            if (callback)
                process.nextTick(() => {
                    callback(
                        null,
                        this.interfaces[
                            serviceName + ':' + objectPath + ':' + interfaceName
                        ],
                    )
                })

            return
        }

        this.introspect(serviceName, objectPath, (err, obj) => {
            if (err) {
                if (callback) {
                    callback(err)
                }

                return
            }

            if (!(interfaceName in obj)) {
                if (callback) {
                    callback(new Error('No such interface'))
                }

                return
            }

            // Create a interface object based on introspect
            var iface = new Interface(
                this,
                serviceName,
                objectPath,
                interfaceName,
                obj[interfaceName],
            )

            iface.init(() => {
                this.interfaces[
                    serviceName + ':' + objectPath + ':' + interfaceName
                ] = iface

                if (callback) {
                    callback(null, iface)
                }
            })
        })
    }

    registerSignalHandler = (
        serviceName: string,
        objectPath: string,
        interfaceName: string,
        interfaceObj: Record<string, any>,
        callback?: Callback,
    ) => {
        this.getUniqueServiceName(serviceName, (err, uniqueName) => {
            // Make a hash
            const signalHash = objectPath + ':' + interfaceName
            this.signalHandlers[signalHash] = interfaceObj

            // Register interface signal handler
            this.addSignalFilter(
                serviceName,
                objectPath,
                interfaceName,
                callback,
            )
        })
    }

    setMaxMessageSize = (size: number) => {
        this._dbus.setMaxMessageSize(this.connection, size || 1024000)
    }

    getUniqueServiceName = (serviceName: string, callback: Callback) => {
        this.callMethod(
            this.connection,
            'org.freedesktop.DBus',
            '/',
            'org.freedesktop.DBus',
            'GetNameOwner',
            's',
            -1,
            [serviceName],
            (err: DBusError, uniqueName: string) => {
                callback(err, uniqueName)
            },
        )
    }

    addSignalFilter = (
        sender: string,
        objectPath: string,
        interfaceName: string,
        callback?: Callback,
    ) => {
        // Initializing signal if it wasn't enabled before
        if (!this.signalEnable) {
            this.signalEnable = true
            this._dbus.addSignalFilter(this.connection, "type='signal'")
        }

        this._dbus.addSignalFilter(
            this.connection,
            "type='signal',sender='" +
                sender +
                "',interface='" +
                interfaceName +
                "',path='" +
                objectPath +
                "'",
        )

        process.nextTick(() => {
            if (callback) callback()
        })
    }

    _sendMessageReply = (message: any, value: any, type: any) => {
        this._dbus.sendMessageReply(message, value, type)
    }

    _sendErrorMessageReply = (message: any, name: any, msg: any) => {
        this._dbus.sendErrorMessageReply(message, name, msg)
    }

    createError = (name: string, message: string) => {
        return new DBusError(name, message)
    }

    callMethod = (...args: any) => {
        args.push(this.createError)

        this._dbus.callMethod(args)
    }
}
