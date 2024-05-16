export type Callback = (...args: any) => any

export type DBusSignature = 'v' | 's' | 'd' | 'b' | 'av' | 'a{sv}'

export type Handler = (...args: any) => any

export type BusType = 'session' | 'system'

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
