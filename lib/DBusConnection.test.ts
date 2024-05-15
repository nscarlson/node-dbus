import { describe, it } from '@jest/globals'
import DBus from './dbus'
import ServiceObject from './service_object'
import Service from './service'
import Interface from './interface'

// mock process.nextTick()
jest.useFakeTimers()

describe('DBusConnection', () => {
    describe('bus connectivity', () => {
        // new dbus instance
        const dbus = new DBus()

        it('connects, disconnects, and reconnects the session bus', (done) => {
            let bus = dbus.getDBusConnection('session')

            expect(bus.connected).toBe(true)

            bus.disconnect()
            expect(bus.connected).toBe(false)

            // reconnect during disconnected state
            bus.reconnect(() => {
                expect(bus.connected).toBe(true)
            })

            // reconnect during connected state
            bus.reconnect(() => {
                expect(bus.connected).toBe(true)
            })

            // TODO: implement system bus testing
            // this is likely only a matter of the environment, i.e. whether the system bus is available and running properly on the underlying OS

            // TODO: fully mock out communication between node-dbus and the actual bus using event emitters
            // relying on a real dbus implementation in the OS for testing does work, but makes the tests more brittle

            // bus = dbus.getDBusConnection('system')
            // expect(bus.connected).toBe('true')

            // bus.disconnect(() => {
            //     expect(bus.connected).toBe(false)
            // })

            done()
        })

        it('disconnects properly', (done) => {
            // get dbus connection
            const bus = dbus.getDBusConnection('session')
            const mockDisconnectCallback = jest.fn(() => undefined)

            bus.disconnect(mockDisconnectCallback)
            jest.runAllTicks()

            expect(mockDisconnectCallback).toHaveBeenCalled()

            done()
        })
    })

    describe('introspection', () => {
        // new dbus instance
        const dbus = new DBus()

        it('throws error if bus is disconnected', (done) => {
            const bus = dbus.getDBusConnection('session')
            bus.disconnect()

            bus.introspect(
                '/nodejs/dbus/object',
                'nodejs.dbus.ExampleService3',
                (err, obj) => {
                    expect(err?.message).toBe('Bus is no longer connected')
                },
            )

            jest.runAllTicks()

            done()
        })

        it('returns correct introspection', () => {
            const bus2 = dbus.getDBusConnection('session')

            const service = new Service(bus2, 'nodejs.dbus.ExampleService3')

            service.createObject('/com/wanco/test/object')

            bus2.introspect(
                'nodejs.dbus.ExampleService3',
                '/com/wanco/test/object',
                (error, value) => {
                    expect(error.message).toBe('No introspectable')

                    bus2.disconnect()
                },
            )

            jest.runAllTicks()
        })
    })

    it('creates a valid DBusError', () => {
        const dbus = new DBus()
        const bus = dbus.getDBusConnection('session')

        const error = bus.createError('testName', 'testMessage')

        expect(error.dbusName).toBe('testName')
        expect(error.message).toBe('testMessage')
    })

    it('fetches an interface from the bus', () => {
        const dbus = new DBus()
        const bus = dbus.getDBusConnection('session')
        const service = new Service(bus, 'nodejs.dbus.ExampleService')
        const object = service.createObject('/com/wanco/test/object1')

        const newInterface = new Interface(
            bus,
            'nodejs.dbus.ExampleService',
            '/com/wanco/test/object1',
            'new_interface',
            object,
        )

        newInterface.init(() => {})

        bus.getInterface(
            'nodejs.dbus.ExampleService',
            '/com/wanco/test/object1',
            'new_interface',
            (err, value) => {
                console.log('value:', value)
            },
        )

        jest.runAllTicks()
    })
})
