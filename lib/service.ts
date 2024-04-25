import EventEmitter from 'node:events'
import Bus from './bus'
import ServiceObject from './service_object'

export default class Service extends EventEmitter {
    constructor(bus: Bus, serviceName: string) {
        super()

        this.bus = bus
        this.serviceName = serviceName
        this.objects = {}

        this.on(
            'request',
            (
                uniqueName,
                sender,
                objectPath,
                interfaceName,
                member,
                message,
                args,
            ) => {
                const iface =
                    this.objects[objectPath]['interfaces'][interfaceName]
                if (!iface) return

                iface.call.apply(iface, [member, message, args])
            },
        )
    }

    bus: Bus
    serviceName: string
    objects: Record<string, any>

    get connected() {
        return this.bus.connected
    }

    createObject = (objectPath: string) => {
        if (!this.objects[objectPath])
            this.objects[objectPath] = new ServiceObject(this, objectPath)

        // Register object
        this.bus._dbus.registerObjectPath(this.bus.connection, objectPath)

        return this.objects[objectPath]
    }

    disconnect = () => {
        this.bus.disconnect()
    }

    removeObject = (object: Record<string, any>) => {
        this.bus._dbus.unregisterObjectPath(this.bus.connection, object.path)

        delete this.objects[object.path]
    }
}
