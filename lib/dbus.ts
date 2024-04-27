const _dbus = require('../build/Release/dbus.node')

import EventEmitter from 'node:events'
import Utils from './utils'
import Bus from './bus'
import Service from './service'
import Error from './error'

type BusName = 'session' | 'system'

export default class DBus {
    constructor() {
        this.Error = Error
    }

    enabledSignal = false
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
        }
    }

    getBus = (busName: BusName) => {
        return new Bus(_dbus, this, busName)
    }

    registerService = (busName: BusName, serviceName: string): any => {
        let _serviceName: string = serviceName

        let serviceHash = ''

        if (serviceName) {
            // Return bus existed
            serviceHash = busName + ':' + _serviceName

            if (this.serviceMap[serviceHash])
                return this.serviceMap[serviceHash]
        }

        // Get a connection
        const bus = this.getBus(busName)

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

            // Fire event
            // const newArgs = ['request'].concat(
            //     Array.prototype.slice.call(arguments),
            // )

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

    _requestName = (bus: Bus, serviceName: string) => {
        _dbus.requestName(bus.connection, serviceName)
    }

    Signature = Utils.Signature
}
