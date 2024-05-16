import { afterAll, describe, it } from '@jest/globals'
import DBus from './dbus'
import ServiceObject from './service_object'
import Service from './service'
import Interface from './interface'

// mock process.nextTick()
jest.useFakeTimers()

describe('Bus', () => {
    describe('bus connectivity', () => {
        it('connects, disconnects, and reconnects the session bus', (done) => {
            let bus = DBus.getBus('session')
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
            // bus = dbus.getBus('system')
            // expect(bus.connected).toBe('true')
            // bus.disconnect(() => {
            //     expect(bus.connected).toBe(false)
            // })
            done()
        })
        it('disconnects properly', (done) => {
            // get dbus connection
            const bus = DBus.getBus('session')
            const mockDisconnectCallback = jest.fn(() => undefined)
            bus.disconnect(mockDisconnectCallback)
            jest.runAllTicks()
            expect(mockDisconnectCallback).toHaveBeenCalled()

            done()
        })
    })

    describe('introspection', () => {
        // it('throws error if bus is disconnected', (done) => {
        //     const bus = dbus.getBus('session')
        //     bus.disconnect()
        //     bus.introspect(
        //         '/nodejs/dbus/object',
        //         'nodejs.dbus.ExampleService3',
        //         (err, obj) => {
        //             expect(err?.message).toBe('Bus is no longer connected')
        //         },
        //     )
        //     jest.runAllTicks()
        //     bus.disconnect()
        //     done()
        // })
        // it('returns correct introspection', (done) => {
        //     const bus2 = dbus.getBus('session')
        //     const service = new Service(bus2, 'nodejs.dbus.ExampleService3')
        //     service.createObject('/com/wanco/test/object')
        //     bus2.introspect(
        //         'nodejs.dbus.ExampleService3',
        //         '/com/wanco/test/object',
        //         (error, value) => {
        //             expect(error.message).toBe('No introspectable')
        //             bus2.disconnect()
        //         },
        //     )
        //     jest.runAllTicks()
        //     bus2.disconnect()
        //     done()
        // })
    })

    it('creates a valid DBusError', () => {
        const bus = DBus.getBus('session')

        const error = bus.createError('testName', 'testMessage')

        expect(error.dbusName).toBe('testName')
        expect(error.message).toBe('testMessage')

        bus.disconnect()
    })

    it('fetches an interface from the bus', (done) => {
        const service = DBus.registerService(
            'session',
            'nodejs.dbus.fetchService',
        )

        const object = service.createObject('/nodejs/dbus/fetchServiceObject')

        const serviceInterface = object.createInterface(
            'nodejs.dbus.fetchService.Interface1',
        )

        serviceInterface.addMethod(
            'Add',
            {
                in: [DBus.Define(Number), DBus.Define(Number)],
                out: DBus.Define(Number),
            },
            (n1, n2, callback) => {
                callback(null, n1 + n2)
            },
        )

        serviceInterface.update()

        /**
         * ///////////////////////////////////
         */

        const bus = DBus.getBus('session')

        // bus.getInterface(
        //     'nodejs.dbus.fetchService',
        //     '/nodejs/dbus/fetchServiceObject',
        //     'nodejs.dbus.fetchService.Interface1',
        //     (err, iface) => {
        //         console.log(err)
        //         console.log('value:', iface)
        //     },
        // )

        jest.runAllTicks()
        done()
    })
})
