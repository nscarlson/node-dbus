import EventEmitter from 'node:events'
import Interface from './interface'
import DBusError from './DBusError'
import DBus from './dbus'
import { BusType, DBusSignature } from './types'
import { defineType } from 'node-dbus'
import ServiceInterface from './service_interface'

type Callback = (...args: any) => any

export default class Bus extends EventEmitter {
    constructor(_dbus: any, dbus: DBus, busType: BusType) {
        super()

        this._dbus = _dbus
        this.busType = busType
        this.signalHandlers = {}
        this.enabledSignal = false

        switch (busType) {
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
                uniqueBusName,
                sender,
                objectPath,
                interfaceName,
                signalName,
                args,
            ) => {
                if (
                    objectPath == '/org/freedesktop/DBus/Local' &&
                    interfaceName == 'org.freedesktop.DBus.Local' &&
                    signalName == 'Disconnected'
                ) {
                    this.reconnect()

                    return
                }

                var signalHash = objectPath + ':' + interfaceName

                if (this.signalHandlers[signalHash]) {
                    const newArgs = [signalName].concat(args)

                    var interfaceObj = this.signalHandlers[signalHash]
                    interfaceObj.emit.apply(interfaceObj, newArgs)
                }
            },
        )

        DBus.signalHandlers[this.connection.uniqueName] = this
        DBus.enableSignal()
    }

    _dbus
    busType: BusType
    connection: any
    signalHandlers: Record<string, any>
    enabledSignal: boolean
    interfaces: Record<string, Interface> = {}

    get connected() {
        return !!this.connection
    }

    disconnect = (callback?: Callback) => {
        delete DBus.signalHandlers[this.connection.uniqueName]

        this._dbus.releaseBus(this.connection)

        this.connection = null

        process.nextTick(() => callback?.())
    }

    reconnect = (callback?: Callback) => {
        if (this.connection) {
            delete DBus.signalHandlers[this.connection.uniqueName]

            this._dbus.releaseBus(this.connection)
        }

        switch (this.busType) {
            case 'system':
                this.connection = this._dbus.getBus(0)
                break

            case 'session':
                this.connection = this._dbus.getBus(1)
                break
        }

        DBus.signalHandlers[this.connection.uniqueName] = this

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

        process.nextTick(() => callback?.())
    }

    introspect = (
        serviceName: string,
        objectPath: string,
        callback: Callback,
    ) => {
        if (!this.connected) {
            process.nextTick(() => {
                callback?.(new Error('Bus is no longer connected'))
            })

            return
        }

        // console.log(
        //     '[bus.introspect]',
        //     'introspecting',
        //     serviceName,
        //     objectPath,
        //     typeof callback,
        // )

        // Getting scheme of specific object
        this.callMethod(
            this.connection,
            serviceName,
            objectPath,
            'org.freedesktop.DBus.Introspectable',
            'Introspect',
            [],
            10000,
            [],
            (err: DBusError, introspect: any) => {
                const obj = this._parseIntrospectSource(introspect)

                if (!obj) {
                    callback?.(new Error('No introspectable'))

                    return
                }

                callback?.(err, obj)
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
        console.log(
            '[bus.getInterface]',
            serviceName,
            objectPath,
            interfaceName,
            typeof callback,
        )

        console.log(Object.keys(this.interfaces))

        if (
            this.interfaces[
                serviceName + ':' + objectPath + ':' + interfaceName
            ]
        ) {
            process.nextTick(() => {
                callback?.(
                    null,
                    this.interfaces[
                        serviceName + ':' + objectPath + ':' + interfaceName
                    ],
                )
            })

            return
        }

        // console.log(
        //     '[bus.getInterface]',
        //     'interface',
        //     interfaceName,
        //     'does not exist',
        // )

        this.introspect(serviceName, objectPath, (err, obj) => {
            // console.log(
            //     '[bus.getInterface]',
            //     'introspecting',
            //     serviceName,
            //     objectPath,
            // )

            if (err) {
                callback?.(err)

                return
            }

            if (!(interfaceName in obj)) {
                callback?.(new Error('No such interface'))

                return
            }

            // Create a interface object based on introspect
            const iface = new Interface(
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

                callback?.(null, iface)
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
        console.log(
            'calling registerSignalHandler:',
            serviceName,
            objectPath,
            interfaceName,
            Object.entries(interfaceObj),
            callback,
        )
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
                callback?.(err, uniqueName)
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
        if (!this.enabledSignal) {
            this.enabledSignal = true
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
            callback?.()
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

    callMethod = (...args: any[]) => {
        args.push(this.createError)
        this._dbus.callMethod(...args)
    }
}
