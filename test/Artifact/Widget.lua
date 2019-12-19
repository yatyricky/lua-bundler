local Widget = class("Widget")

function Widget:ctor()
    self.type = "Widget"
end

function Widget:Run()
    print("I'm" .. self.type)
end
return Widget