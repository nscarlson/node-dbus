const _dbus = require(process.env.NODE_ENV === 'test'
    ? '../build/Release/dbus.node'
    : '../Release/dbus.node')

import EventEmitter from 'node:events'
import Utils from './utils'
import Bus from './Bus'
import Service from './service'
import Error from './DBusError'
import { BusType } from './types'

export default class DBus {
    private static enabledSignal: boolean = false
    static Error: Error
    static serviceMap: Record<string, any> = {}
    static signalHandlers: Record<string, EventEmitter> = {}

    static {
        // Dispatch events to service
        _dbus.setObjectHandler(function (
            uniqueName: string,
            sender: unknown,
            objectPath: unknown,
            interfaceName: unknown,
            member: unknown,
            message: unknown,
            args: unknown,
        ) {
            for (const hash in DBus.serviceMap) {
                const service = DBus.serviceMap[hash]

                if (service.bus.connection.uniqueName != uniqueName) continue

                // Fire event
                const newArgs = ['request'].concat(
                    Array.prototype.slice.call(arguments),
                )
                service.emit.apply(service, newArgs)

                break
            }
        })
    }

    static enableSignal = () => {
        if (!DBus.enabledSignal) {
            DBus.enabledSignal = true

            _dbus.setSignalHandler((uniqueName: string) => {
                if (DBus.signalHandlers[uniqueName]) {
                    const args: any = ['signal', uniqueName]

                    DBus.signalHandlers[uniqueName].emit(args)
                }
            })
        } else {
            // console.info('[DBus.enableSignal]', 'signal already enabled')
        }
    }

    static getBus = (busType: BusType) => {
        return new Bus(_dbus, DBus, busType)
    }

    static registerService = (
        busType: BusType,
        serviceName: string,
    ): Service => {
        let _serviceName: string = serviceName

        let serviceHash = ''

        if (serviceName) {
            // Return bus existed
            serviceHash = busType + ':' + _serviceName

            if (DBus.serviceMap[serviceHash])
                return DBus.serviceMap[serviceHash]
        }

        // Get a connection
        const bus = DBus.getBus(busType)

        if (!serviceName) {
            _serviceName = bus.connection.uniqueName
        }

        // Create service
        const service = new Service(bus, _serviceName)
        DBus.serviceMap[serviceHash] = service

        if (serviceName) {
            DBus._requestName(bus, _serviceName)
        }

        return service
    }

    static setObjectHandler = (
        uniqueName: string,
        sender: any,
        objectPath: string,
        interfaceName: string,
        member: any,
        message: any,
        args: any[],
    ) => {
        for (const hash in DBus.serviceMap) {
            const service = DBus.serviceMap[hash]

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

    static Define = Utils.Define

    static _requestName = (bus: Bus, serviceName: string) => {
        _dbus.requestName(bus.connection, serviceName)
    }

    static Signature = Utils.Signature
}
