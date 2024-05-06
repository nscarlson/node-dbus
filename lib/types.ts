export type Callback = (...args: any) => any

const ALL_SIGNATURES = ['v', 's', 'd', 'b', 'av', 'a{sv}'] as const

export type DBusSignature = 'v' | 's' | 'd' | 'b' | 'av' | 'a{sv}'

export type Handler = (...args: any) => any

export enum BusType {
    session = 'session',
    system = 'system',
}

export type defineType =
    | 'Auto'
    | typeof String
    | typeof Number
    | typeof Boolean
    | typeof Array
    | typeof Object
    | string

export type FieldDefinition = {
    type: defineType
    name: string
}
