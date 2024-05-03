import { Callback, DBusSignatureType, defineType } from 'dbus'

type signatureDefinition = {
    type: defineType
    name: string
}

export const Define = (
    type: any,
    name?: string,
): { type: DBusSignatureType; name?: string } => {
    const field = {
        ...(!!name && { name }),
        type: Signature(type),
    }

    return field
}

export const Signature = (type: defineType): DBusSignatureType => {
    const nodeTypes = ['Auto', String, Number, Boolean, Array, Object]
    const dbusTypes: DBusSignatureType[] = ['v', 's', 'd', 'b', 'av', 'a{sv}']

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
