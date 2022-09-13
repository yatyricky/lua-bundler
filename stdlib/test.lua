local EventCenter = require("EventCenter")
local FrameBegin = EventCenter.FrameBegin
local FrameUpdate = EventCenter.FrameUpdate
local Timer = require("Timer")
local FrameTimer = require("FrameTimer")
local Time = require("Time")
require("CoroutineExt")

local tminus = 5
local tm = Timer.new(function()
    print(tminus, "@", Time.Time)
    tminus = tminus - 1
end, 1, 5)
tm:Start()

local ftc = 5
local ft = FrameTimer.new(function ()
    FrameTimer.new(function ()
        print("frame", ftc, "@", Time.Time, Time.Frame)
        ftc = ftc - 1
    end, 1, 5):Start()
end, 30, 1):Start()

coroutine.start(function ()
    for i = 1, 10, 1 do
        print("Good", i, Time.Time, Time.Frame)
        coroutine.step()
    end
end)

-- main loop
local dt = Time.Delta
for i = 1, 300 do
    FrameBegin:Emit(dt)
    FrameUpdate:Emit(dt)
end

EventCenter.Report()
