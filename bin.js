const main = require("./main")

const args = process.argv.slice(2)
if (args.length < 3) {
    console.log("cli <f|w> <input.lua> <output.lua> [-p|-d]")
    return
}
if (args[0] === "w") {
    main.injectWC3(args[1], args[2], args[3])
} else {
    main.toFile(args[1], args[2], args[3])
}
