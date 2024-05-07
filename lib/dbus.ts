const _dbus = require('../Release/dbus.node')

import EventEmitter from 'node:events'
import Utils from './utils'
import DBusConnection from './DBusConnection'
import Service from './service'
import Error from './DBusError'
import { BusType } from './types'
export default class DBus {
    constructor() {
        this.Error = Error
        this.enabledSignal = false
    }

    enabledSignal: boolean
    Error
    serviceMap: any = {}
    signalHandlers: Record<string, EventEmitter> = {}

    enableSignal = () => {
        if (!this.enabledSignal) {
            this.enabledSignal = true

            _dbus.setSignalHandler((uniqueName: string) => {
                if (this.signalHandlers[uniqueName]) {
                    const args: any = ['signal', uniqueName]

                    this.signalHandlers[uniqueName].emit(args)
                }
            })
        } else {
            console.info('[DBus.enableSignal]', 'signal already enabled')
        }
    }

    getDBusConnection = (busType: BusType) => {
        return new DBusConnection(_dbus, this, busType)
    }

    registerService = (busType: BusType, serviceName: string): Service => {
        let _serviceName: string = serviceName

        let serviceHash = ''

        if (serviceName) {
            // Return bus existed
            serviceHash = busType + ':' + _serviceName

            if (this.serviceMap[serviceHash])
                return this.serviceMap[serviceHash]
        }

        // Get a connection
        const bus = this.getDBusConnection(busType)

        if (!serviceName) {
            _serviceName = bus.connection.uniqueName
        }

        // Create service
        const service = new Service(bus, _serviceName)
        this.serviceMap[serviceHash] = service

        if (serviceName) {
            this._requestName(bus, _serviceName)
        }

        return service
    }

    setObjectHandler = (
        uniqueName: string,
        sender: any,
        objectPath: string,
        interfaceName: string,
        member: any,
        message: any,
        args: any[],
    ) => {
        for (const hash in this.serviceMap) {
            const service = this.serviceMap[hash]

            if (service.bus.connection.uniqueName != uniqueName) {
                continue
            }

            const newArgs = [
                'request',
                uniqueName,
                sender,
                objectPath,
                interfaceName,
                member,
                message,
            ].concat(args)

            service.emit.apply(service, newArgs)

            break
        }
    }

    Define = Utils.Define

    _requestName = (bus: DBusConnection, serviceName: string) => {
        _dbus.requestName(bus.connection, serviceName)
    }

    Signature = Utils.Signature
}
