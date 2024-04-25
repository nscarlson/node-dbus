const EventEmitter = require('events')
const service = jest.createMockFromModule('./service')

class Service extends EventEmitter {
    constructor(bus, serviceName) {
        super()

        this.bus = bus
        this.serviceName = serviceName

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

                if (!iface) {
                    return
                }

                iface.call.apply(iface, [member, message, args])
            },
        )
    }

    bus
    serviceName
    objects = {}

    connected = () => this.bus.connected

    ForEachAsync = (arr, callback, complete) => {}
}

module.exports = Service
