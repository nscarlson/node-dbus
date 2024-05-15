import DBus from './dbus'

import { describe, expect, test } from '@jest/globals'

describe('dbus class', () => {
    const dbus = new DBus()
    const bus = dbus.getDBusConnection('session')

    afterAll(() => bus.disconnect())

    describe('signals', () => {
        const mockSignalCallback = jest.fn(() => undefined)

        const service = dbus.registerService('session', 'test.dbus.TestService')

        const obj = service.createObject('/test/dbus/TestService')

        const iface1 = obj.createInterface('test.dbus.TestService.Interface1')

        iface1.addMethod(
            'NoArgs',
            { out: dbus.Define(String) },

            (callback) => {
                callback(null, 'result!')
            },
        )

        iface1.addSignal('pump', {
            types: [dbus.Define(String)],
        })

        obj.updateIntrospection()

        iface1.update()

        // bus.getInterface(
        //     'test.dbus.TestService',
        //     '/test/dbus/TestService',
        //     'test.dbus.TestService.Interface1',
        //     () => {},
        // )

        afterAll(() => {
            service.disconnect()
        })

        it('execute a signal handler when the signal is fired', (done) => {
            iface1.on('pump', mockSignalCallback)

            iface1.emit('pump', 'signal 1')

            expect(mockSignalCallback).toBeCalledTimes(1)

            done()
        })
    })
})
