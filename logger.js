module.exports = {
    success: function (...params) {
        if (params.length > 0) {
            params[0] = "\u001B[32m" + params[0] + "\u001B[0m"
        }
        console.log(...params)
    },
    log: console.log,
    warn: function (...params) {
        if (params.length > 0) {
            params[0] = "\u001B[33m" + params[0] + "\u001B[0m"
        }
        console.log(...params)
    },
    error: function (...params) {
        if (params.length > 0) {
            params[0] = "\u001B[31m" + params[0] + "\u001B[0m"
        }
        console.log(...params)
    },
}
