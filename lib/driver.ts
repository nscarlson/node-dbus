import DBus from './dbus'
import { BusType } from './types'

const bus1 = DBus.getBus('session')

const dbusService = DBus.registerService(
    'session',
    'nodejs.dbus.ExampleService',
)
const object = dbusService.createObject('/nodejs/dbus/ExampleService')
const serviceInterface = object.createInterface(
    'nodejs.dbus.ExampleService.Interface1',
)

serviceInterface.addMethod(
    'MakeError',
    { out: [DBus.Define(String)] },
    (callback: () => any) => {
        callback?.(
            // @ts-ignore
            DBus.Error('nodejs.dbus.ExampleService.ErrorTest', 'Some error'),
        )
    },
)

serviceInterface.addMethod(
    'SendObject',
    { in: [DBus.Define(Object)], out: [DBus.Define(Object)] },
    (obj: any, callback: any) => {
        callback?.(null, obj)
    },
)

// Update the interface so all dbus clients serviceInterface changes
serviceInterface.update()

// @ts-ignore
// serviceInterface.call(
//     'SendObject',
//     [
//         {
//             name: 'Fred',
//             email: 'cfsghost@gmail.com',
//         },
//     ],
//     'testmsg',
// )
