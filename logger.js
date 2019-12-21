module.exports = {
    success: function (...params) {
        console.log("✔", ...params)
    },
    log: console.log,
    warn: function (...params) {
        console.log("⚠", ...params)
    },
    error: function (...params) {
        console.log("❌", ...params)
    },
}
