import logger from "./logger.js"
import * as main from "./main.js"

const args = process.argv.slice(2)

const help = "lua-bundler -i <input.lua> -o <output.lua> [-p|--production] [-e|--exclude <path1;path2;...>] [-d|--define <FLAG1;FLAG2;...>]"

let input = undefined
let output = undefined
let production = false
let exclude = []
let defines = []

for (let i = 0; i < args.length; i++) {
    if (args[i] === "-p" || args[i] === "--production") {
        production = true
    } else if (args[i] === "-i" || args[i] === "--input") {
        i++
        if (args[i] === undefined) {
            logger.error(`${args[i - 1]} must be followed by a file path`)
            logger.log(help)
            process.exit(1)
        }
        input = args[i]
    } else if (args[i] === "-o" || args[i] === "--output") {
        i++
        if (args[i] === undefined) {
            logger.error(`${args[i - 1]} must be followed by a file path`)
            logger.log(help)
            process.exit(1)
        }
        output = args[i]
    } else if (args[i] === "-e" || args[i] === "--exclude") {
        i++
        if (args[i] === undefined) {
            logger.error(`${args[i - 1]} must be followed with list of paths`)
            logger.log(help)
            process.exit(1)
        }
        exclude = args[i].split(";")
    } else if (args[i] === "-d" || args[i] === "--define") {
        i++
        if (args[i] === undefined) {
            logger.error(`${args[i - 1]} must be followed with list of flags`)
            logger.log(help)
            process.exit(1)
        }
        defines = args[i].split(";")
    } else {
        logger.error(`unknown argument ${args[i]}.`)
        logger.log(help)
        process.exit(1)
    }
}

if (input === undefined || output === undefined) {
    logger.error(`-i and -o are required`)
    logger.log(help)
    process.exit(1)
}

if (output.endsWith("war3map.lua")) {
    main.injectWC3(input, output, production, exclude, defines)
} else {
    main.toFile(input, output, production, exclude, defines)
}
