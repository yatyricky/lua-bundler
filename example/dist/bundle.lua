local __modules = {}
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

__modules["Dir.Logger"]={loader=function()
local Logger = {}

function Logger.Log(msg)
    print("Logger.Log" .. msg)
end

print("module Logger loaded")

return Logger

end}

__modules["Dir.Unused"]={loader=function()
local Unused = {}

Unused.value = 15

return Unused

end}

__modules["Main"]={loader=function()
require("Dir/Logger")
local Test = require("Test")

print("This is main", 'hfoo')

Test.Run()

end}

__modules["Reporter"]={loader=function()
function Reporter(...)
    print(...)
end
end}

__modules["Test"]={loader=function()
local Logger = require("Dir/Logger")

local Test = {}

function Test.Run()
    Logger.Log("Test.Run")
end

print("module Test loaded")

return Test

end}

__modules["Main"].loader()