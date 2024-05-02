export type Callback = (...args: any) => any

export type DBusSignatureType = 'v' | 's' | 'd' | 'b' | 'av' | 'a{sv}'

export type Handler = (...args: any) => any

export enum DBusType {
    session = 'session',
    system = 'system',
}
