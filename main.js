const fs = require("fs")
const path = require("path")
const readline = require("readline")
const luamin = require("luamin")
const logger = require("./logger")

function tryParseInt(any) {
    try {
        return parseInt(any, 10)
    } catch (error) {
        return 0
    }
}

let workDir
let outStr

/**
 * @param {fs.PathLike} dirName relative path
 */
function recurseFiles(dir, excludeMap) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fp = path.join(dir, file)
        const st = fs.statSync(fp)
        if (st.isFile()) {
            if (excludeMap.files[fp] === 1) {
                continue
            }

            if (file.endsWith(".lua")) {
                const moduleName = fp.replace(workDir, "").substring(1).replace(/\\/g, ".").replace(".lua", "")
                outStr += `\n__modules["${moduleName}"]={loader=function()\n`
                outStr += fs.readFileSync(fp)
                outStr += `\nend}\n`
            }
        } else if (st.isDirectory()) {
            if (file.endsWith(".w3m") || file.endsWith(".w3x") || file.startsWith(".")) {
                continue
            }

            if (excludeMap.dirs[fp] === 1) {
                continue
            }

            recurseFiles(fp, excludeMap)
        } else {
            logger.error("WTF is " + fp)
        }
    }
}

/**
 * Takes entry file and returns bundled lua source code.
 * @param {fs.PathLike} mainPath
 * @returns {string}
 */
function emitCode(mainPath, minify, exclude) {
    if (!fs.existsSync(mainPath) || !fs.statSync(mainPath).isFile()) {
        logger.error(`File not found ${mainPath}`)
        process.exit(1)
    }

    outStr = `local __modules = {}
local require = function(path)
    local module = __modules[path]
    if module == nil then
        local dotPath = string.gsub(path, "/", "%.")
        module = __modules[dotPath]
        __modules[path] = module
    end
    if module ~= nil then
        if not module.inited then
            module.cached = module.loader()
            module.inited = true
        end
        return module.cached
    else
        error("module not found " .. path)
        return nil
    end
end
`
    workDir = path.resolve(path.dirname(mainPath))
    const excludeMap = { files: {}, dirs: {} }
    for (const excludePath of exclude) {
        const resolvedExcludePath = path.resolve(path.join(workDir, excludePath))
        if (!fs.existsSync(resolvedExcludePath)) {
            logger.error(`Cannot resolve path ${resolvedExcludePath}`)
            process.exit(1)
        }
        const st = fs.statSync(resolvedExcludePath)
        if (st.isFile()) {
            excludeMap.files[resolvedExcludePath] = 1
        } else if (st.isDirectory()) {
            excludeMap.dirs[resolvedExcludePath] = 1
        } else {
            logger.error("WTF is " + resolvedExcludePath)
        }
    }
    recurseFiles(workDir, excludeMap)
    const mainName = path.basename(mainPath, ".lua")
    outStr += `\n__modules["${mainName}"].loader()`
    if (minify) {
        outStr = luamin.minify(outStr)
    }
    return outStr
}

const headerSize = 9
const headerLead = "--lua-bundler:"
const overhead1 = `--lua-bundler:ReplaceMe
local function RunBundle()
`
const overhead2 = `
end
--lua-bundler:ReplaceMe

`

/**
 * Bundles lua source and inject into war3map.lua
 * @param {fs.PathLike} mainPath 
 * @param {fs.PathLike} wc3path 
 * @param {boolean} mode will minify source
 * @returns {void}
 */
function injectWC3(mainPath, wc3path, mode, exclude) {
    logger.log("Injection mode")
    if (!fs.existsSync(wc3path) || !fs.statSync(wc3path).isFile()) {
        logger.error(`File not found ${wc3path}`)
        process.exit(1)
    }
    let file = emitCode(mainPath, mode, exclude)
    const totalLen = file.length + overhead1.length + overhead2.length
    // pad source length with leading 0s
    let sourceLen = totalLen.toString()
    for (let i = sourceLen.length; i < headerSize; i++) {
        sourceLen = "0" + sourceLen
    }

    file = `${overhead1.replace("ReplaceMe", sourceLen)}${file}${overhead2.replace("ReplaceMe", sourceLen)}`
    if (totalLen !== file.length) {
        logger.error("source length calculation failed")
        process.exit(1)
    }

    const all = fs.readFileSync(wc3path).toString()
    if (all.startsWith(headerLead)) {
        // replace
        const currCodeLen = tryParseInt(all.substring(headerLead.length, headerLead.length + headerSize))
        if (currCodeLen === 0) {
            logger.error("Read already injected war3map.lua header failed. Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }

        // verify
        const verification = tryParseInt(all.substring(currCodeLen - headerSize - 2, currCodeLen - 2)) // 2 LF
        if (currCodeLen !== verification) {
            logger.error("war3map.lua source may have been changed manually (injected source length check failed). Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }

        const body = all.substring(currCodeLen)
        const newFile = `${file}${body}`
        fs.writeFileSync(wc3path, newFile)
        logger.success(`Update ${wc3path} success. Injected source length: ${currCodeLen} => ${totalLen}.`)
    } else {
        // inject new
        const ri = readline.createInterface({
            input: fs.createReadStream(wc3path),
        })
        let state = 0
        let outFile = file
        let changed = false
        ri.on("line", (line) => {
            if (state === 0 && line === "function main()") {
                state = 1
                changed = true
            }
            if (state === 1 && line === "end") {
                outFile += `local s, m = pcall(RunBundle)
if not s then
    print(m)
end
`
                state = 0
            }
            outFile += line + "\n"
        })
        ri.on("close", () => {
            fs.writeFileSync(wc3path, outFile)
            if (changed) {
                logger.success(`Write ${wc3path} success. Injected source length: ${totalLen}.`)
            } else {
                logger.error("Target file is not war3map.lua")
                process.exit(1)
            }
        })
    }
}

/**
 * Bundles lua source and write to file.
 * @param {fs.PathLike} mainPath 
 * @param {fs.PathLike} outPath 
 * @param {boolean} mode will minify source
 * @returns {void}
 */
function toFile(mainPath, outPath, mode, exclude) {
    logger.log("Write file mode")
    if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
        logger.error(`Target is dir ${outPath}`)
        process.exit(1)
    }
    let file = emitCode(mainPath, mode, exclude)
    fs.writeFileSync(outPath, file)
    logger.success(`Write to ${outPath} success`)
}

module.exports = {
    injectWC3,
    toFile,
}
