import { describe, it, expect, afterEach, beforeEach } from '@jest/globals'

import ServiceInterface from './service_interface'
import ServiceObject from './service_object'
import Service from './service'
import DBus from './dbus'

describe('ServiceInterface', () => {
    describe('introspection', () => {
        let service: Service
        let serviceObject: ServiceObject

        beforeEach(() => {
            service = new Service(DBus.getBus('session'), 'com.wanco.test')
            serviceObject = new ServiceObject(service, '/com/wanco/test/object')
        })

        afterEach(() => {
            service.disconnect()
        })

        it('has the correct initial introspection', () => {
            const serviceInterface = new ServiceInterface(
                serviceObject,
                'testInterface',
            )

            expect(serviceObject.introspection).toEqual('')
        })

        it('adds a method to the interface correctly', () => {
            const serviceInterface = new ServiceInterface(
                serviceObject,
                'com.wanco.test.interface',
            )

            serviceInterface.addMethod(
                'SendObject',
                {
                    in: [DBus.Define(Object), 'inputobject'],
                    out: [DBus.Define(Object), 'outputobject'],
                },
                (obj: any, callback: any) => {
                    console.log('yo, I received a message:', obj)
                },
            )

            // @ts-ignore
            // serviceInterface.call(
            //     // @ts-ignore
            //     { key: { nestedkey: 'val' } },
            //     'testMessage',
            //     {
            //         inputObject: { key: 'val' },
            //     },
            // )

            serviceInterface.addSignal('test_signal', {
                types: [DBus.Define(Object, 'book')],
            })

            serviceInterface.addListener('test_signal', (...args: any) =>
                console.log('test_signal fired:', args),
            )

            serviceInterface.update()

            serviceInterface.emitSignal('test_signal', {
                book: 'lord of the rings',
            })
        })
    })
})
