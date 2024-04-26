import EventEmitter from 'node:events'
import Utils from './utils'
import { defineType } from 'dbus'

type Handler = (...args: any) => any

type MethodOptions = {
    in?: { name: string; type: string }[]
    out?: { name: string; type: string }[]
}
type MethodObject = {
    handler: Handler
    opts: MethodOption
}

export default class ServiceInterface extends EventEmitter {
    constructor(object, interfaceName) {
        super()

        this.object = object
        this.name = interfaceName
        this.introspection = null
        this.methods = {}
        this.properties = {}
        this.signals = {}
    }

    object: Record<string, any>
    name: string
    introspection: string
    methods: Record<string, any>
    properties
    signals

    addMethod = (methodName: string, opts: MethodOptions, handler: Handler) => {
        let methodObj = {
            handler,
        }

        if (opts?.in?.length) {
            var argSignature = []

            for (const index in opts?.in) {
                argSignature.push(opts?.in?.[index])
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

    addProperty = (propName: string, opts) => {
        var _opts = opts || {}
        var propObj = {
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

    addSignal = (signalName, opts) => {
        if (!opts) {
            return
        }

        self.signals[signalName] = opts

        self.on(signalName, function () {
            var args = [signalName].concat(
                Array.prototype.slice.call(arguments),
            )
            self.emitSignal.apply(this, args)
        })

        return self
    }

    call = (method, message, args) => {
        var member = self.methods[method]
        if (!member) {
            self.object.service.bus._sendErrorMessageReply(
                message,
                'org.freedesktop.DBus.Error.UnknownMethod',
            )
            return
        }

        var inArgs = member['in'] || []
        if (inArgs.length != args.length) {
            self.object.service.bus._sendErrorMessageReply(
                message,
                'org.freedesktop.DBus.Error.InvalidArgs',
            )
            return
        }

        let type: defineType

        if (typeof member.out === 'function') {
            // allow interfaces such as 'org.freedesktop.DBus.Properties' to return out definition according arguments
            type = member.out.apply(this, [self.name, method, args]).type
        } else if (member.out) {
            type = member.out.type || ''
        }

        // Preparing callback
        args = Array.prototype.slice.call(args).concat([
            function (err, value) {
                // Error handling
                if (err) {
                    var errorName = 'org.freedesktop.DBus.Error.Failed'
                    var errorMessage = err.toString()
                    if (err instanceof Error) {
                        errorMessage = err.message
                        errorName =
                            err.dbusName || 'org.freedesktop.DBus.Error.Failed'
                    }
                    self.object.service.bus._sendErrorMessageReply(
                        message,
                        errorName,
                        errorMessage,
                    )

                    return
                }

                self.object.service.bus._sendMessageReply(message, value, type)
            },
        ])

        member.handler.apply(this, args)
    }

    getProperty = (propName: string, callback) => {
        var prop = this.properties[propName]

        if (!prop) {
            return false
        }

        prop.getter.apply(this, [
            function (err, value) {
                if (callback) callback(err, value)
            },
        ])

        return true
    }

    update = () => {
        var introspection = []

        introspection.push('<interface name="' + this.name + '">')

        // Methods
        for (var methodName in this.methods) {
            var method = this.methods[methodName]

            introspection.push('<method name="' + methodName + '">')

            // Arguments
            for (const index in method['in']) {
                let arg = method['in'][index]

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

            if (method['out']) {
                var out_def = method['out']

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
        for (var propName in this.properties) {
            var property = this.properties[propName]

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
        for (var signalName in this.signals) {
            var signal = this.signals[signalName]

            introspection.push('<signal name="' + signalName + '">')

            // Arguments
            if (signal.types) {
                for (var index in signal.types) {
                    var arg = signal.types[index]
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

        this.introspection = introspection.join('\n')

        return this
    }

    setProperty = (propName, value, callback) => {
        const prop = self.properties[propName]

        if (!prop) {
            return false
        }

        var args = [value]

        args.push(function (err) {
            // Completed
            callback(err)
        })

        prop.setter.apply(this, args)

        return true
    }

    getProperties = (callback) => {
        var properties = {}

        var props = Object.keys(self.properties)

        Utils.ForEachAsync(
            props,
            (propName, index, arr, next) => {
                // Getting property
                var prop = self.properties[propName]
                prop.getter(function (err, value) {
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
            function () {
                if (callback) callback(null, properties)
            },
        )
    }

    emitSignal = () => {
        const service = this.object.service

        if (!service.connected) {
            throw new Error('Service is no longer connected')
        }

        var conn = this.object.service.bus.connection
        var objPath = this.object.path
        var interfaceName = this.name
        var signalName = arguments[0]

        var args = Array.prototype.slice.call(arguments)
        args.splice(0, 1)

        var signal = this.signals[signalName] || null
        if (!signal) return

        var signatures = []
        for (var index in signal.types) {
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
