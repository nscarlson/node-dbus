import { afterAll, beforeEach, describe, it } from '@jest/globals'
import DBus from './dbus'
import Service from './service'
import ServiceObject from './service_object'

let service: Service
let serviceObject: ServiceObject

// beforeEach(() => {
//     service = DBus.registerService('session', 'nodejs.dbus.ExampleService')
//     serviceObject = service.createObject('/nodejs/dbus/ExampleService')
//     // service.disconnect()
// })

describe('service_object', () => {
    it('adds 2 + 2', () => {
        expect(2 + 2).toBe(4)
    })
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
    // it('throws error for object with duplicate object path', (done) => {
    //     const service = dbus.registerService(
    //         'session',
    //         'nodejs.dbus.ExampleService',
    //     )
    //     const objectPath = '/nodejs/dbus/ExampleService'
    //     expect(() => {
    //         service.createObject(objectPath)
    //         service.createObject(objectPath)
    //     }).toThrow('A handler is already registered for' + ' ' + objectPath)
    //     service.disconnect()
    //     done()
    // })
    // it('updates introspection', (done) => {
    //     expect(serviceObject.introspection).toEqual('')
    //     serviceObject.updateIntrospection()
    //     expect(serviceObject.introspection).toContain(
    //         '/nodejs/dbus/ExampleService',
    //     )
    //     done()
    // })
})
