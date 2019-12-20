local Logger = {}

function Logger.Log(msg)
    print("Logger.Log" .. msg)
end

print("module Logger loaded")

return Logger
