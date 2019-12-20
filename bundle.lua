
local __modules = {}
local require = function(path)
    local module = __modules[path]
    if module ~= nil then
        if not module.inited then
            module.cached = module.loader()
            module.inited = true
        end
        return module.cached
    else
        error("module not found")
        return nil
    end
end

----------------
__modules["Main"] = { inited = false, cached = false, loader = function(...)
---- START Main.lua ----
require("Dir/Logger")
local Test = require("Test")

print("This is main")

Test.Run()

---- END Main.lua ----
 end}
----------------
__modules["Dir/Logger"] = { inited = false, cached = false, loader = function(...)
---- START Dir/Logger.lua ----
local Logger = {}

function Logger.Log(msg)
    print("Logger.Log" .. msg)
end

print("module Logger loaded")

return Logger

---- END Dir/Logger.lua ----
 end}
----------------
__modules["Test"] = { inited = false, cached = false, loader = function(...)
---- START Test.lua ----
local Logger = require("Dir/Logger")

local Test = {}

function Test.Run()
    Logger.Log("Test.Run")
end

print("module Test loaded")

return Test

---- END Test.lua ----
 end}
__modules["Main"].loader()