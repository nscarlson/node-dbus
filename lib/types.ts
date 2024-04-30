export type Callback = (...args: any) => any
export type Handler = (...args: any) => any

export enum DBusType {
    session = 'session',
    system = 'system',
}
