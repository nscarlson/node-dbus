var tap = require('tap')
var DBus = require('../')
const DBusError = require('../lib/error')

tap.plan(5)

var baseError = new DBusError('test.dbus.TestService.BaseError', 'Basic error')
tap.type(baseError, Error)
tap.type(baseError, DBus.Error)
tap.equal(baseError.dbusName, 'test.dbus.TestService.BaseError')
tap.equal(baseError.message, 'Basic error')
tap.match(baseError.toString(), /DBusError/)
