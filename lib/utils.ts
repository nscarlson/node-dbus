import { Callback, defineType } from 'dbus'
import { DBusSignature } from './types'

export const Define = (
    type: any,
    name?: string,
): { type: DBusSignature; name?: string } => {
    const field = {
        ...(!!name && { name }),
        type: Signature(type),
    }

    return field
}

export const Signature = (type: defineType): DBusSignature => {
    const nodeTypes = ['Auto', String, Number, Boolean, Array, Object]
    const dbusTypes: DBusSignature[] = ['v', 's', 'd', 'b', 'av', 'a{sv}']

    return nodeTypes.indexOf(type) !== -1
        ? dbusTypes[nodeTypes.indexOf(type)]
        : 'v'
}

const ForEachAsync = (
    arr: Array<any>,
    callback: Callback,
    complete: Callback,
) => {
    try {
        let index = 0

        for (const value of arr) {
            callback?.(value, index++, arr)
        }

        complete(true)
    } catch (err) {
        throw new Error('ForEachAsync: ' + (err as Error).message)
    }
}

export default {
    Define,
    Signature,
    ForEachAsync,
}
