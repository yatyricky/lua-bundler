const main = require("./main")

const args = process.argv.slice(2)
if (args.length < 2) {
    console.log("lua-bundler <input.lua> <output.lua> [-p]")
    return
}

if (args[1].endsWith("war3map.lua")) {
    main.injectWC3(args[0], args[1], args[2])
} else {
    main.toFile(args[0], args[1], args[2])
}
