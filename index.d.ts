// Type definitions for dbus 1.0
// Project: https://github.com/Shouqun/node-dbus#readme
// Definitions by: Luca Lindhorst <https://github.com/lal12>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
declare module 'dbus' {
    export class DBus {
        constructor(type: busType)

        connect(): DBusConnection
        Define(
            type: defineType,
            name?: string,
        ): { type: DBusSignatureType; name: string }
        registerService(busName: busType, serviceName: string): DBusService
        // Example method
        sendMessage(message: string): void
    }

    export type Callback = (...args: any) => any
    export type DBusError = Error
    export type busType = 'session' | 'system'
    export type defineType =
        | 'Auto'
        | typeof String
        | typeof Number
        | typeof Boolean
        | typeof Array
        | typeof Object
        | string

    export type DBusSignatureType = 'v' | 's' | 'd' | 'b' | 'av' | 'a{sv}'

    export type interfaceMethodByName = { [key: string]: any }

    export function getBus(type: busType): DBusConnection

    export function DBusError(name: string, message: string): void

    export interface DBusConnection {
        getInterface(
            serviceName: string,
            objectPath: string,
            interfaceName: string,
            callback: (err: DBusError, iface: DBusInterface) => void,
        ): void
        disconnect(): void
    }

    export interface DBusInterface {
        getProperty(
            propertyName: string,
            callback: (err: DBusError, name: string) => void,
        ): void
        setProperty(
            name: string,
            value: any,
            callback: (err: DBusError) => void,
        ): void
        getProperties(
            callback: (
                err: DBusError,
                properties: Array<{ [name: string]: any }>,
            ) => void,
        ): void
        /**
         * ...args
         * options: {timeout: number}
         * callback: (err: DBusError | undefined, res: any) => void
         */
        [methodName: string]: (...args: any[]) => void
    }

    export interface DBusService {
        createObject(path: string): DBusServiceObject
        removeObject(service: DBusServiceObject): void
        disconnect(): void
    }

    export interface DBusServiceObject {
        createInterface(name: string): DBusServiceInterface
    }

    export type PropsCB = (err: DBusError, value: any) => void
    export interface DBusServiceInterface {
        addMethod(
            method: string,
            opts: {
                in?: { name: string; type: string }[]
                out?: { name: string; type: string }[]
            },
            handler: (res: any, obj: any) => void,
        ): void
        addProperty(
            name: string,
            opts: {
                type: string
                getter: (cb: (val: string) => void) => void
                setter?: (value: any, done: () => void) => void
            },
        ): void
        addSignal(name: string, opts: { types: string[] }): void
        call(methodName: string, message: any, args: any): void
        emitSignal(name: string, ...values: any[]): void
        update(): void
    }
}
