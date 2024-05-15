import { afterAll, beforeEach, describe, it } from '@jest/globals'
import DBus from './dbus'
import Service from './service'

const dbus = new DBus()

let service: Service

beforeEach(() => {
    // service = dbus.registerService('session', 'nodejs.dbus.ExampleService')
    // const serviceObject = service.createObject('/nodejs/dbus/ExampleService')
    // service.disconnect()
})

describe('service_object', () => {
    // it('creates a new interface', (done) => {
    //     const serviceInterface = serviceObject.createInterface(
    //         'nodejs.dbus.ExampleService.Interface1',
    //     )
    //     expect(
    //         Object.keys(serviceObject.interfaces).includes(
    //             'nodejs.dbus.ExampleService.Interface1',
    //         ),
    //     ).toBe(true)
    //     done()
    // })

    it('throws error for object with duplicate object path', (done) => {
        const service = dbus.registerService(
            'session',
            'nodejs.dbus.ExampleService',
        )

        const objectPath = '/nodejs/dbus/ExampleService'

        expect(() => {
            service.createObject(objectPath)
            service.createObject(objectPath)
        }).toThrow('A handler is already registered for' + ' ' + objectPath)

        service.disconnect()
        done()
    })

    // it('updates introspection', (done) => {
    //     expect(serviceObject.introspection).toEqual('')
    //     serviceObject.updateIntrospection()
    //     expect(serviceObject.introspection).toContain(
    //         '/nodejs/dbus/ExampleService',
    //     )
    //     done()
    // })
})
