import Service from './service'
import ServiceInterface from './service_interface'

import Utils from './utils'

export default class ServiceObject {
    constructor(service: Service, objectPath: string) {
        this.service = service
        this.path = objectPath

        // Initializing introspectable interface
        this.introspectableInterface = this.createInterface(
            'org.freedesktop.DBus.Introspectable',
        )

        this.introspectableInterface.addMethod(
            'Introspect',
            { out: Utils.Define(String, 'data') },
            (callback) => {
                this.updateIntrospection()
                callback?.(null, this.introspection)
            },
        )
        this.introspectableInterface.update()

        // Initializing property interface
        this.propertyInterface = this.createInterface(
            'org.freedesktop.DBus.Properties',
        )

        this.propertyInterface.addMethod(
            'Get',
            {
                in: [
                    Utils.Define(String, 'interface_name'),
                    Utils.Define(String, 'property_name'),
                ],
                out: this.DefineByPropName('value'),
            },
            (interfaceName, propName, callback) => {
                const iface = this.interfaces[interfaceName]

                if (!iface) {
                    callback?.(new Error("Doesn't support such property"))
                    return
                }

                if (!iface.getProperty(propName, callback))
                    callback?.(new Error("Doesn't support such property"))
            },
        )

        this.propertyInterface.addMethod(
            'Set',
            {
                in: [
                    Utils.Define(String, 'interface_name'),
                    Utils.Define(String, 'property_name'),
                    Utils.Define('auto', 'value'),
                ],
            },
            (interfaceName, propName, value, callback) => {
                const iface = this.interfaces[interfaceName]

                if (!iface) {
                    callback?.(new Error("Doesn't support such property"))
                    return
                }

                if (!iface.setProperty(propName, value, callback))
                    callback?.(new Error("Doesn't support such property"))
            },
        )

        this.propertyInterface.addMethod(
            'GetAll',
            {
                in: [Utils.Define(String, 'interface_name')],
                out: Utils.Define(Object, 'properties'),
            },
            (interfaceName, callback) => {
                const iface = this.interfaces[interfaceName]

                if (!iface) {
                    callback?.(new Error("Doesn't have any properties"))
                    return
                }

                iface.getProperties((err, props) => {
                    callback?.(err, props)
                })
            },
        )

        this.propertyInterface.addSignal('PropertiesChanged', {
            types: [
                Utils.Define(String, 'interface_name'),
                Utils.Define(Object, 'changed_properties'),
                Utils.Define(Array, 'invalidated_properties'),
            ],
        })

        this.propertyInterface.update()
    }

    interfaces: Record<string, ServiceInterface> = {}
    introspectableInterface: ServiceInterface
    introspection: string = ''
    path: string
    propertyInterface: ServiceInterface
    service

    buildChildNodes = () => {
        const unique = (arr: any[]) => {
            const t: Record<number, boolean> = {}

            for (let i = 0; i < arr.length; i++) {
                t[arr[i]] = true
            }

            return Object.keys(t)
        }

        const prefix = this.path + '/'
        const allKeys = Object.keys(this.service.objects)

        const childKeys = allKeys.filter(
            (key) =>
                key.substring(0, prefix.length) === prefix &&
                key.length > prefix.length,
        )

        const unprefixedChildKeys = childKeys.map((key) => {
            return key.substring(prefix.length)
        })

        const childNodes = unprefixedChildKeys.map((key) => {
            return key.split('/')[0]
        })

        const uniqueChildNodes = unique(childNodes)

        return uniqueChildNodes
    }

    createInterface = (interfaceName: string): ServiceInterface => {
        // console.log('[createInterface]')

        // console.log('[createInterface]', Object.keys(this.interfaces))

        if (!this.interfaces[interfaceName]) {
            this.interfaces[interfaceName] = new ServiceInterface(
                this,
                interfaceName,
            )

            this.interfaces[interfaceName].update()
        }

        // console.log('[createInterface]', Object.keys(this.interfaces))

        return this.interfaces[interfaceName]
    }

    DefineByPropName = (name: string): { name?: string; type: string }[] => {
        const def = Utils.Define('Auto', name)

        return [def]

        // TODO: Determine use cases for the following code
        // This function is only called once from this class's constructor.
        // This is for setting up getters and setters for the interface_name and property_name
        // on this service object's property Interface (ServiceInterface)

        // this.propertyInterface.addMethod(
        // 'Get',
        // {
        //     in: [
        //         Utils.Define(String, 'interface_name'),
        //         Utils.Define(String, 'property_name'),
        //     ],
        //     out: this.DefineByPropName('value'),
        // },

        // const interfaceName = this.propertyInterface.name
        // const propName = name
        // const iface = this['interfaces'][interfaceName]

        // if (iface) {
        //     const prop = iface.properties[propName]

        //     if (prop?.type?.type) {
        //         def.type = prop.type.type
        //     }
        // }

        // return def
    }

    updateIntrospection = () => {
        const introspection: (string[] | string)[] = [
            '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"',
            '"http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">',
            '<node name="' + this.path + '">',
        ]

        for (const interfaceName in this.interfaces) {
            const iface = this.interfaces[interfaceName]
            introspection.push(iface.introspection as string[])
        }

        const childNodes = this.buildChildNodes()

        for (let i = 0; i < childNodes.length; i++) {
            introspection.push('<node name="' + childNodes[i] + '"/>')
        }

        introspection.push('</node>')

        console.log('[updateIntrospection]')
        console.log(introspection.join('\n'))

        this.introspection = introspection.join('\n')
    }
}
