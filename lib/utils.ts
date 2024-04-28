import { DBusSignatureType, defineType } from 'dbus'

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

export const ForEachAsync = (
    arr: any[],
    callback: (...args: any) => any,
    complete: (...args: any) => any,
) => {
    try {
        const next = (index: number, length: number) => {
            if (index >= length) {
                if (complete) {
                    complete(true)
                }

                return
            }

            const _next = (stop?: boolean) => {
                if (stop === false) {
                    if (complete) {
                        complete(false)
                    }

                    return
                }

                if (ret === false) {
                    if (complete) {
                        complete(false)
                    }

                    return
                }

                next(index + 1, length)
            }

            const ret = callback(arr[index], index, arr, _next)

            if (ret != true) {
                _next()
            }
        }

        // Base case, call with initial index 0 and array length
        next(0, arr.length)
    } catch (err) {
        throw new Error('ForEachAsync: ' + (err as Error).message)
    }
}

// const ForEachAsync = (arr, callback, complete) => {
//     try {
//         let index = 0

//         for (const value of arr) {
//             callback(value, index++, arr)
//         }

//         complete(true)
//     } catch (err) {
//         throw new Error('ForEachAsync: ' + err.message)
//     }
// }

export default {
    Define,
    Signature,
    ForEachAsync,
}
