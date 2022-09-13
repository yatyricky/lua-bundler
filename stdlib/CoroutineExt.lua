local Timer = require("Timer")
local FrameTimer = require("FrameTimer")

local c2t = setmetatable({}, { __mode = "kv" })

function coroutine.start(f, ...)
    local c = coroutine.create(f)

    if coroutine.running() == nil then
        local success, msg = coroutine.resume(c, ...)
        if not success then
            print(msg)
        end
    else
        local args = { ... }
        local timer = FrameTimer.new(function()
            c2t[c] = nil
            local success, msg = coroutine.resume(c, unpack(args))
            if not success then
                timer:Stop()
                print(msg)
            end
        end, 1, 1)
        c2t[c] = timer
        timer:Start()
    end

    return c
end

function coroutine.wait(t)
    local c = coroutine.running()
    local timer = nil

    local function action()
        c2t[c] = nil

        local success, msg = coroutine.resume(c)
        if not success then
            timer:Stop()
            print(msg)
        end
    end

    timer = Timer.new(action, t, 1)
    c2t[c] = timer
    timer:Start()
    coroutine.yield()
end

function coroutine.step(t)
    local c = coroutine.running()
    local timer = nil

    local function action()
        c2t[c] = nil

        local success, msg = coroutine.resume(c)
        if not success then
            timer:Stop()
            print(msg)
        end
    end

    timer = FrameTimer.new(action, t or 1, 1)
    c2t[c] = timer
    timer:Start()
    coroutine.yield()
end

function coroutine.stop(c)
    local timer = c2t[c]
    if timer ~= nil then
        c2t[c] = nil
        timer:Stop()
    end
end
