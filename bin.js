const logger = require("./logger")
const main = require("./main")

const args = process.argv.slice(2)

const help = "lua-bundler <input.lua> <output.lua> [-p|--production] [-e|--exclude <path1;path2;...>]"

let input = undefined
let output = undefined
let production = false
let exclude = []

for (let i = 0; i < args.length; i++) {
    if (args[i] === "-p" || args[i] === "--production") {
        production = true
    } else if (args[i] === "-e" || args[i] === "--exclude") {
        i++
        if (args[i] === undefined) {
            logger.error(`-e must be followed with list paths`)
            logger.log(help)
            process.exit(1)
        }
        exclude = args[i].split(";")
    } else if (args[i].startsWith("-")) {
        logger.error(`unknown option ${args[i]}.`)
        logger.log(help)
        process.exit(1)
    } else {
        if (input === undefined) {
            input = args[i]
        } else if (output === undefined) {
            output = args[i]
        } else {
            logger.error(`unknown argument ${args[i]}.`)
            logger.log(help)
            process.exit(1)
        }
    }
}

if (input === undefined || output === undefined) {
    logger.error(`must specify input or output`)
    logger.log(help)
    process.exit(1)
}

if (output.endsWith("war3map.lua")) {
    main.injectWC3(input, output, production, exclude)
} else {
    main.toFile(input, output, production, exclude)
}
