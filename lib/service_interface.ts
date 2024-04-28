import EventEmitter from 'node:events'
import Utils from './utils'
import DBusError from './error'
import ServiceObject from './service_object'
import { defineType } from 'dbus'

type Callback = (...args: any) => any

type Handler = (...args: any) => any

export default class ServiceInterface extends EventEmitter {
    constructor(object: ServiceObject, interfaceName: string) {
        super()

        this.object = object
        this.name = interfaceName
        this.introspection = []
        this.methods = {}
        this.properties = {}
        this.signals = {}
    }

    object: Record<string, any>
    name: string
    introspection: string | (string | string[])[]
    methods: Record<string, any>
    properties: Record<string, any>
    signals: Record<string, any>

    addMethod = (methodName: string, opts: any, handler: Handler) => {
        let methodObj: Record<string, any> = {
            handler,
        }

        if (opts?.in?.length) {
            const argSignature: any[] = []

            for (const opt of opts.in) {
                for (const index in opt) {
                    argSignature.push(opt?.[index])
                }
            }

            if (argSignature.length) {
                methodObj.in = argSignature
            }
        }

        if (opts.out) {
            methodObj.out = opts.out
        }

        this.methods[methodName] = methodObj

        return this
    }

    addProperty = (propName: string, opts: any) => {
        const _opts = opts || {}

        const propObj = {
            access: 'read',
            type: opts.type || 'v',
            getter: opts.getter || null,
            setter: opts.setter || null,
        }

        if (_opts['setter']) {
            propObj['access'] = 'readwrite'
        }

        this.properties[propName] = propObj

        return this
    }

    addSignal = (signalName: string, opts: any) => {
        if (!opts) {
            return
        }

        this.signals[signalName] = opts

        this.on(signalName, () => {
            const args = [signalName].concat([signalName, opts])

            this.emitSignal.apply(this, args)
        })

        return this
    }

    call = (method: string, message: string, args: any) => {
        const member = this.methods[method]

        if (!member) {
            this.object.service.bus._sendErrorMessageReply(
                message,
                'org.freedesktop.DBus.Error.UnknownMethod',
            )
            return
        }

        const inArgs = member.in || []

        if (inArgs.length != args.length) {
            this.object.service.bus._sendErrorMessageReply(
                message,
                'org.freedesktop.DBus.Error.InvalidArgs',
            )

            return
        }

        let inputType: defineType

        if (typeof member.out === 'function') {
            // allow interfaces such as 'org.freedesktop.DBus.Properties' to return out definition according arguments
            inputType = member.out.apply(this, [this.name, method, args]).type
        } else if (member.out) {
            inputType = member.out.type || ''
        }

        // Preparing callback
        args = Array.prototype.slice.call(args).concat([
            (err: DBusError, value: any) => {
                // Error handling
                if (err) {
                    let errorName = 'org.freedesktop.DBus.Error.Failed'
                    let errorMessage = err.toString()

                    if (err instanceof DBusError) {
                        errorMessage = err.message
                        errorName =
                            err.dbusName || 'org.freedesktop.DBus.Error.Failed'
                    }

                    this.object.service.bus._sendErrorMessageReply(
                        message,
                        errorName,
                        errorMessage,
                    )

                    return
                }

                this.object.service.bus._sendMessageReply(
                    message,
                    value,
                    inputType,
                )
            },
        ])

        member.handler.apply(this, args)
    }

    getProperty = (propName: string, callback: Callback) => {
        let prop = this.properties[propName]

        if (!prop) {
            return false
        }

        prop.getter.apply(this, [
            (err: DBusError, value: any) => {
                if (callback) {
                    callback(err, value)
                }
            },
        ])

        return true
    }

    update = () => {
        let introspection: string[] = []

        introspection.push('<interface name="' + this.name + '">')

        // Methods
        for (const methodName in this.methods) {
            const method = this.methods[methodName]

            introspection.push('<method name="' + methodName + '">')

            // Arguments
            for (const index in method.in) {
                let arg = method.in[index]

                if (typeof arg === 'function') {
                    arg = arg.apply(this, [this.name, method, []])
                }

                if (arg.name)
                    introspection.push(
                        '<arg direction="in" type="' +
                            arg.type +
                            '" name="' +
                            arg.name +
                            '"/>',
                    )
                else
                    introspection.push(
                        '<arg direction="in" type="' + arg.type + '"/>',
                    )
            }

            if (method.out) {
                let out_def = method.out

                if (typeof out_def === 'function') {
                    out_def = out_def.apply(this, [this.name, method, []])
                }

                if (out_def.name) {
                    introspection.push(
                        '<arg direction="out" type="' +
                            out_def.type +
                            '" name="' +
                            out_def.name +
                            '"/>',
                    )
                } else
                    introspection.push(
                        '<arg direction="out" type="' + out_def.type + '"/>',
                    )
            }

            introspection.push('</method>')
        }

        // Properties
        for (const propName in this.properties) {
            const property = this.properties[propName]

            introspection.push(
                '<property name="' +
                    propName +
                    '" type="' +
                    property['type'].type +
                    '" access="' +
                    property['access'] +
                    '"/>',
            )
        }

        // Signal
        for (const signalName in this.signals) {
            const signal = this.signals[signalName]

            introspection.push('<signal name="' + signalName + '">')

            // Arguments
            if (signal.types) {
                for (const index in signal.types) {
                    const arg = signal.types[index]
                    if (arg.name)
                        introspection.push(
                            '<arg type="' +
                                arg.type +
                                '" name="' +
                                arg.name +
                                '"/>',
                        )
                    else introspection.push('<arg type="' + arg.type + '"/>')
                }
            }

            introspection.push('</signal>')
        }

        introspection.push('</interface>')

        this.introspection = introspection.join('\n') as string

        return this
    }

    setProperty = (propName: string, value: any, callback: Callback) => {
        const prop = this.properties[propName]

        if (!prop) {
            return false
        }

        const args = [value]

        args.push((err: DBusError) => {
            // Completed
            callback(err)
        })

        prop.setter.apply(this, args)

        return true
    }

    getProperties = (callback: Callback) => {
        let properties: Record<string, any> = {}

        const props = Object.keys(this.properties)

        Utils.ForEachAsync(
            props,
            (propName: string, index: number, arr: any[], next: Callback) => {
                // Getting property
                const prop = this.properties[propName]

                prop.getter((err: DBusError, value: any) => {
                    if (err) {
                        // TODO: What do we do if a property throws an error?
                        // For now, just skip the property?
                        return next()
                    }
                    properties[propName] = value

                    next()
                })

                return true
            },
            () => {
                if (callback) {
                    callback(null, properties)
                }
            },
        )
    }

    emitSignal = (...args: any) => {
        const service = this.object.service

        if (!service.connected) {
            throw new Error('Service is no longer connected')
        }

        const conn = this.object.service.bus.connection
        const objPath = this.object.path
        const interfaceName = this.name
        const signalName = args[0]

        // const args = Array.prototype.slice.call(arguments)

        args.splice(0, 1)

        const signal = this.signals[signalName] || null

        if (!signal) {
            return
        }

        const signatures: string[] = []

        for (const index in signal.types) {
            signatures.push(signal.types[index].type)
        }

        this.object.service.bus._dbus.emitSignal(
            conn,
            objPath,
            interfaceName,
            signalName,
            args,
            signatures,
        )

        return this
    }
}
