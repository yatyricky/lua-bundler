local Logger = class("Logger")
require("Manager/Attributes")

function Logger.GetInstance()
    if not Logger._inst then
        Logger._inst = Logger.new()
    end
    return Logger._inst
end

function Logger:Log(msg)
    print("Logger.Log" .. msg)
end
return Logger