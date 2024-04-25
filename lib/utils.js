'use strict'

var Define = function (type, name) {
    var dataDef = {
        type: Signature(type),
    }

    if (name) {
        dataDef.name = name
    }

    return dataDef
}

var Signature = function (type) {
    if (type == 'Auto') {
        return 'v'
    } else if (type === String) {
        return 's'
    } else if (type === Number) {
        return 'd'
    } else if (type === Boolean) {
        return 'b'
    } else if (type === Array) {
        return 'av'
    } else if (type === Object) {
        return 'a{sv}'
    }

    return 'v'
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
