local Logger = require("Dir/Logger")

local Test = {}

function Test.Run()
    Logger.Log("Test.Run")
end

print("module Test loaded")

return Test
