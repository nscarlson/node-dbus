import { describe, it, expect } from '@jest/globals'

import ServiceInterface from './service_interface'
import ServiceObject from './service_object'
import Service from './service'
import Bus from './bus'
import DBus from './dbus'

describe('ServiceInterface', () => {
    describe('introspection', () => {
        const dbus = new DBus()
        const service = new Service(dbus.getBus('session'), 'testService')
        const serviceObject = new ServiceObject(service, 'test.service')

        it('has the correct initial introspection', () => {
            const serviceInterface = new ServiceInterface(
                serviceObject,
                'testInterface',
            )

            expect(serviceObject.introspection).toEqual('')
        })
    })
})
