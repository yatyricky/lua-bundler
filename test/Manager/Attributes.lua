local Attributes = class("Attributes")

function Attributes.GetInstance()
    if not Attributes._inst then
        Attributes._inst = Attributes.new()
    end
    return Attributes._inst
end

function Attributes:Log(msg)
    print("Attributes.Log" .. msg)
end
return Attributes