local FrameBegin = require("EventCenter").FrameBegin

local cls = {}

cls.Time = 0
cls.Frame = 0
cls.Delta = 1 / 30

FrameBegin:On(cls, function(_, dt)
    cls.Time = cls.Time + dt
    cls.Frame = cls.Frame + 1
end)

return cls
