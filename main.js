const fs = require("fs")
const path = require("path")
const readline = require("readline")
const luamin = require("luamin")
const logger = require("./logger")

let workDir
let outStr

/**
 * @param {fs.PathLike} dirName relative path
 */
function recurseFiles(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fp = path.join(dir, file)
        const st = fs.statSync(fp)
        if (st.isFile()) {
            if (file.endsWith(".lua")) {
                const moduleName = fp.replace(workDir, "").substring(1).replace("\\", ".").replace(".lua", "")
                outStr += `\n__modules["${moduleName}"]={loader=function()\n`
                outStr += fs.readFileSync(fp)
                outStr += `\nend}\n`
            }
        } else if (st.isDirectory()) {
            if (file.endsWith(".w3m") || file.endsWith(".w3x") || file.startsWith(".")) {
                continue
            }
            recurseFiles(fp)
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
function emitCode(mainPath, minify) {
    if (!fs.existsSync(mainPath) || !fs.statSync(mainPath).isFile()) {
        logger.error(`File not found ${mainPath}`)
        return ""
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
    logger.log("Working directory: " + workDir)
    recurseFiles(workDir)
    const mainName = path.basename(mainPath, ".lua")
    outStr += `\n__modules["${mainName}"].loader()`
    if (minify) {
        outStr = luamin.minify(outStr)
    }
    return outStr
}

const headerSize = 9
const headerLead = "--lua-bundler:"
const headerWrapStart = "local function RunBundle()"

/**
 * Bundles lua source and inject into war3map.lua
 * @param {fs.PathLike} mainPath 
 * @param {fs.PathLike} wc3path 
 * @param {string} mode -p will minify source
 * @returns {void}
 */
function injectWC3(mainPath, wc3path, mode) {
    logger.log("Injection mode")
    if (!fs.existsSync(wc3path) || !fs.statSync(wc3path).isFile()) {
        logger.error(`File not found ${wc3path}`)
        return
    }
    let file = emitCode(mainPath, mode === "-p")
    let sourceLen = file.length.toString()
    for (let i = sourceLen.length; i < headerSize; i++) {
        sourceLen = "0" + sourceLen
    }
    const all = fs.readFileSync(wc3path).toString()
    if (all.startsWith(headerLead)) {
        // replace
        const currCodeLen = parseInt(all.substring(headerLead.length, headerLead.length + headerSize))
        const body = all.substring(headerLead.length + headerSize + 1 + headerWrapStart.length + 1 + currCodeLen)
        const newFile = `${headerLead}${sourceLen}\n${headerWrapStart}\n${file}${body}`
        fs.writeFileSync(wc3path, newFile)
        logger.success(`Write to ${wc3path} success`)
    } else {
        // inject new
        const ri = readline.createInterface({
            input: fs.createReadStream(wc3path),
        })
        let state = 0
        let outFile = `--lua-bundler:${sourceLen}\nlocal function RunBundle()\n${file}\nend\n\n`
        let changed = false
        ri.on("line", (line) => {
            if (state === 0 && line === "function main()") {
                state = 1
                changed = true
            }
            if (state === 1 && line === "end") {
                outFile += "RunBundle()\n"
                state = 0
            }
            outFile += line + "\n"
        })
        ri.on("close", () => {
            fs.writeFileSync(wc3path, outFile)
            if (changed) {
                logger.success(`Write to ${wc3path} success`)
            } else {
                logger.error("Target file is not war3map.lua")
            }
        })
    }
}

/**
 * Bundles lua source and write to file.
 * @param {fs.PathLike} mainPath 
 * @param {fs.PathLike} outPath 
 * @param {string} mode -p will minify source
 * @returns {void}
 */
function toFile(mainPath, outPath, mode) {
    logger.log("Write file mode")
    if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
        logger.error(`Target is dir ${outPath}`)
        return
    }
    let file = emitCode(mainPath, mode === "-p")
    fs.writeFileSync(outPath, file)
    logger.success(`Write to ${outPath} success`)
}

module.exports = {
    injectWC3,
    toFile,
}
