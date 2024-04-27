import { describe, expect, it } from '@jest/globals'
import DBusError from './error'

const DBus = require('../')

const baseError = new DBusError(
    'test.dbus.TestService.BaseError',
    'Basic error',
)

describe('Basic DBus error', () => {
    it('Is of type Error', () => {
        expect(baseError).toBeInstanceOf(Error)
    })

    it('Is of type DBus.Error', () => {
        expect(baseError).toBeInstanceOf(DBusError)
    })

    it('Matches the passed DBus name', () => {
        expect(baseError.dbusName).toEqual('test.dbus.TestService.BaseError')
    })

    it('Matches the passed error message', () => {
        expect(baseError.message).toEqual('Basic error')
    })

    it('toString matches /DBusError/ regex', () => {
        expect((baseError.toString().match(/DBusError/) || []).length).toEqual(
            1,
        )
    })
})
