import { describe } from '@jest/globals'
import DBus from './dbus'

describe('interface class', () => {
    const dbus = new DBus()
    const bus = dbus.getDBusConnection('session')

    let iface1

    bus.getInterface(
        'test.dbus.TestService',
        '/test/dbus/TestService',
        'test.dbus.TestService.Interface1',
        (err, iface) => {
            iface1 = iface
        },
    )

    afterAll(() => bus.disconnect())

    it('does something', (done) => {
        expect(4).toEqual(4)

        done()
    })
})
