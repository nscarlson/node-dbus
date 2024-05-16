import { describe, expect, it } from '@jest/globals'
import DBus from './dbus'

describe('service', () => {
    describe('connectivity', () => {
        it('connects and disconnects to bus properly', (done) => {
            const service = DBus.registerService(
                'session',
                'nodejs.dbus.ExampleService',
            )

            expect(service.connected).toBe(true)

            service.disconnect()

            expect(service.connected).toBe(false)

            done()
        })

        it('throws if disconnected while registering service and successfully registers after reconnect', (done) => {
            let service = DBus.registerService(
                'session',
                'nodejs.dbus.ExampleService2',
            )

            service.disconnect()

            expect(() => {
                service.createObject('/nodejs/dbus/ExampleService2')
            }).toThrow('bus is not connected')

            service = DBus.registerService(
                'session',
                'nodejs.dbus.ExampleService3',
            )

            expect(() => {
                service.createObject('/nodejs/dbus/ExampleService3')
            })

            service.disconnect()

            done()
        })
    })
})
