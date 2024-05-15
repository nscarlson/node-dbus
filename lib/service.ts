import EventEmitter from 'node:events'
import DBusConnection from './DBusConnection'
import ServiceObject from './service_object'
import DBusError from './DBusError'

export default class Service extends EventEmitter {
    constructor(bus: DBusConnection, serviceName: string) {
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

    bus: DBusConnection
    serviceName: string
    objects: Record<string, any>

    get connected() {
        return this.bus.connected
    }

    createObject = (objectPath: string): ServiceObject => {
        try {
            if (!this.connected) {
                throw new Error('bus is not connected')
            }

            if (!this.objects[objectPath])
                this.objects[objectPath] = new ServiceObject(this, objectPath)

            // Register object
            this.bus._dbus.registerObjectPath(this.bus.connection, objectPath)

            return this.objects[objectPath]
        } catch (error) {
            throw new DBusError(
                '[service.createObject]',
                (error as Error).message,
            )
        }
    }

    disconnect = () => {
        this.bus.disconnect()
    }

    removeObject = (object: Record<string, any>) => {
        this.bus._dbus.unregisterObjectPath(this.bus.connection, object.path)

        delete this.objects[object.path]
    }
}
