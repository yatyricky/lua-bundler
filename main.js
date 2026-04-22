import fs from "fs"
import path from "path"
import readline from "readline"
import crypto from "crypto"
import luamin from "luamin"
import logger from "./logger.js"

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
 * Processes --#IF FLAG THEN ... --#END blocks.
 * Blocks whose flag is not in `defines` are removed entirely.
 * @param {string} source
 * @param {Set<string>} defines
 * @returns {string}
 */
/**
 * Tokenises a boolean expression into an array of tokens.
 * Tokens are: '(', ')', 'OR', 'AND', or flag identifiers.
 * @param {string} expr
 * @returns {string[]}
 */
function tokenize(expr) {
    const tokens = []
    const re = /\(|\)|NOT|OR|AND|[A-Za-z_][A-Za-z0-9_]*/g
    let m
    while ((m = re.exec(expr)) !== null) {
        tokens.push(m[0])
    }
    return tokens
}

/**
 * Evaluates a boolean expression against a set of defined flags.
 * Grammar:
 *   expr     := or_expr
 *   or_expr  := and_expr ('OR' and_expr)*
 *   and_expr := atom ('AND' atom)*
 *   atom     := NOT atom | FLAG | '(' expr ')'
 * @param {string} expr
 * @param {Set<string>} defines
 * @returns {boolean}
 */
function evalExpr(expr, defines) {
    const tokens = tokenize(expr)
    let pos = 0

    function peek() { return tokens[pos] }
    function consume() { return tokens[pos++] }

    function parseOr() {
        let result = parseAnd()
        while (peek() === "OR") {
            consume()
            result = parseAnd() || result
        }
        return result
    }

    function parseAnd() {
        let result = parseAtom()
        while (peek() === "AND") {
            consume()
            result = parseAtom() && result
        }
        return result
    }

    function parseAtom() {
        const tok = peek()
        if (tok === "NOT") {
            consume()
            return !parseAtom()
        }
        if (tok === "(") {
            consume()
            const result = parseOr()
            if (peek() !== ")") throw new Error(`Expected ')' in --#IF expression: ${expr}`)
            consume()
            return result
        }
        if (tok === undefined) throw new Error(`Unexpected end of --#IF expression: ${expr}`)
        consume()
        return defines.has(tok)
    }

    return parseOr()
}

function preprocess(source, defines) {
    return source.replace(/--#IF (.+?) THEN\r?\n([\s\S]*?)--#END/g, (_, expr, body) => {
        return evalExpr(expr.trim(), defines) ? body : ""
    })
}

/**
 * Extracts all static require("...") module names from a Lua source string.
 * @param {string} source preprocessed Lua source
 * @returns {string[]}
 */
function extractRequires(source) {
    const deps = []
    const re = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
    let m
    while ((m = re.exec(source)) !== null) {
        deps.push(m[1])
    }
    return deps
}

/**
 * Converts a module name (dot or slash separated) to an absolute file path.
 * @param {string} name e.g. "Lib.Time" or "Lib/Time"
 * @returns {string}
 */
function moduleNameToPath(name) {
    const parts = name.split(/[.\/]/)
    return path.join(workDir, ...parts) + ".lua"
}

/**
 * Returns true if the given absolute path is excluded.
 * @param {string} fp
 * @param {{files: Object, dirs: Object}} excludeMap
 * @returns {boolean}
 */
function isExcluded(fp, excludeMap) {
    if (excludeMap.files[fp] === 1) return true
    for (const dir of Object.keys(excludeMap.dirs)) {
        if (fp.startsWith(dir + path.sep)) return true
    }
    return false
}

/**
 * Takes entry file and returns bundled lua source code.
 * @param {fs.PathLike} mainPath
 * @param {boolean} minify
 * @param {string[]} exclude
 * @param {string[]} defines
 * @returns {string}
 */
function emitCode(mainPath, minify, exclude, defines) {
    const defineSet = new Set(defines || [])
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
    // Tree-shaking: BFS from the entry module, only emit reachable files
    const entryName = path.basename(mainPath, ".lua")
    const visited = new Set()
    const queue = [entryName]
    let emitted = 0
    while (queue.length > 0) {
        const name = queue.shift()
        // Normalise: the runtime maps slash-paths to dot-paths, so always use dots
        const normName = name.replace(/\//g, ".")
        if (visited.has(normName)) continue
        visited.add(normName)

        const fp = moduleNameToPath(normName)
        if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
            logger.warn(`[tree-shake] module "${normName}" -> ${fp} not found, skipping`)
            continue
        }
        if (isExcluded(fp, excludeMap)) {
            logger.warn(`[tree-shake] module "${normName}" is excluded, skipping`)
            continue
        }

        const raw = fs.readFileSync(fp).toString()
        const processed = preprocess(raw, defineSet)
        outStr += `\n__modules["${normName}"]={loader=function()\n`
        outStr += processed
        outStr += `\nend}\n`
        emitted++

        for (const dep of extractRequires(processed)) {
            const normDep = dep.replace(/\//g, ".")
            if (!visited.has(normDep)) {
                queue.push(normDep)
            }
        }
    }
    logger.log(`[tree-shake] emitted ${emitted} module(s) reachable from "${entryName}"`)
    const mainName = entryName
    outStr += `\n__modules["${mainName}"].loader()`
    if (minify) {
        outStr = luamin.minify(outStr)
    }
    return outStr
}

const HEADER_LEAD = "--lua-bundler:"
const LEN_DIGITS = 9
const HASH_CHARS = 16
// Tag format: "<9-digit-total-len>/<16-hex-sha256-of-bundle-code>"  (26 chars)
const TAG_SIZE = LEN_DIGITS + 1 + HASH_CHARS

// Fixed byte counts for the wrapper (tag slots are always TAG_SIZE chars):
//   header: HEADER_LEAD(14) + tag(26) + \n(1) + "local function RunBundle()\n"(27) = 68
//   footer: \nend\n(5) + HEADER_LEAD(14) + tag(26) + \n\n(2)                      = 47
const BUNDLE_CODE_START = HEADER_LEAD.length + TAG_SIZE + 1 + "local function RunBundle()\n".length  // 68
const FOOTER_LEN = "\nend\n".length + HEADER_LEAD.length + TAG_SIZE + "\n\n".length                   // 47
const FIXED_OVERHEAD = BUNDLE_CODE_START + FOOTER_LEN  // 115

/**
 * Builds the bundler header+footer tag embedding total length and content hash.
 * @param {string} bundleCode
 * @returns {{ tag: string, totalLen: number }}
 */
function makeTag(bundleCode) {
    const totalLen = FIXED_OVERHEAD + bundleCode.length
    const lenPart = totalLen.toString().padStart(LEN_DIGITS, "0")
    const hashPart = crypto.createHash("sha256").update(bundleCode).digest("hex").substring(0, HASH_CHARS)
    return { tag: `${lenPart}/${hashPart}`, totalLen }
}

/**
 * Wraps bundle code in the lua-bundler header/footer envelope.
 * @param {string} bundleCode
 * @returns {string}
 */
function wrapBundle(bundleCode) {
    const { tag } = makeTag(bundleCode)
    return `${HEADER_LEAD}${tag}\nlocal function RunBundle()\n${bundleCode}\nend\n${HEADER_LEAD}${tag}\n\n`
}

/**
 * Bundles lua source and inject into war3map.lua
 * @param {fs.PathLike} mainPath 
 * @param {fs.PathLike} wc3path 
 * @param {boolean} mode will minify source
 * @returns {void}
 */
export function injectWC3(mainPath, wc3path, mode, exclude, defines) {
    logger.log("Injection mode")
    if (!fs.existsSync(wc3path) || !fs.statSync(wc3path).isFile()) {
        logger.error(`File not found ${wc3path}`)
        process.exit(1)
    }
    const bundleCode = emitCode(mainPath, mode, exclude, defines)
    const file = wrapBundle(bundleCode)
    const totalLen = file.length

    const all = fs.readFileSync(wc3path).toString()
    if (all.startsWith(HEADER_LEAD)) {
        // Parse existing tag from header
        const rawTag = all.substring(HEADER_LEAD.length, HEADER_LEAD.length + TAG_SIZE)
        const slashAt = rawTag.indexOf("/")

        if (slashAt !== LEN_DIGITS) {
            logger.error("Malformed bundler header tag. Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }
        const currLen = tryParseInt(rawTag.substring(0, LEN_DIGITS))
        const currHash = rawTag.substring(LEN_DIGITS + 1)
        if (currLen === 0) {
            logger.error("Read injected header length failed. Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }

        // Verify footer tag matches header tag (detects shifted boundaries)
        const footerTagStart = currLen - FOOTER_LEN + "\nend\n".length + HEADER_LEAD.length
        const footerTag = all.substring(footerTagStart, footerTagStart + TAG_SIZE)
        if (footerTag !== rawTag) {
            logger.error("war3map.lua footer tag mismatch (file may have been manually modified). Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }

        // Verify content hash (detects same-length edits)
        const existingBundleCode = all.substring(BUNDLE_CODE_START, currLen - FOOTER_LEN)
        const existingHash = crypto.createHash("sha256").update(existingBundleCode).digest("hex").substring(0, HASH_CHARS)
        if (existingHash !== currHash) {
            logger.error("war3map.lua bundle content hash mismatch (file may have been manually modified). Please re-save map in WorldEditor and try again.")
            process.exit(1)
        }

        const body = all.substring(currLen)
        fs.writeFileSync(wc3path, `${file}${body}`)
        logger.success(`Update ${wc3path} success. Injected size: ${currLen} => ${totalLen}.`)
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
export function toFile(mainPath, outPath, mode, exclude, defines) {
    logger.log("Write file mode")
    if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
        logger.error(`Target is dir ${outPath}`)
        process.exit(1)
    }
    let file = emitCode(mainPath, mode, exclude, defines)
    fs.writeFileSync(outPath, file)
    logger.success(`Write to ${outPath} success`)
}
