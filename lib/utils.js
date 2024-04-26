var Define = function (type, name) {
    const field = {
        ...(!!name && { name }),
        type: Signature(type),
    }

    return field
}

var Signature = function (type) {
    const nodeTypes = ['Auto', String, Number, Boolean, Array, Object]
    const dbusTypes = ['v', 's', 'd', 'b', 'av', 'a{sv}']

    return nodeTypes.indexOf(type) !== -1
        ? dbusTypes[nodeTypes.indexOf(type)]
        : 'v'
}

const ForEachAsync = function (arr, callback, complete) {
    try {
        function next(index, length) {
            if (index >= length) {
                if (complete) {
                    complete(true)
                }

                return
            }

            function _next(stop) {
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

                next.apply(this, [index + 1, length])
            }

            const ret = callback(arr[index], index, arr, _next)

            if (ret != true) {
                _next()
            }
        }

        // Base case, call with initial index 0 and array length
        next.apply(this, [0, arr.length])
    } catch (err) {
        throw new Error('ForEachAsync: ' + err.message)
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

module.exports = {
    Define,
    Signature,
    ForEachAsync,
}
