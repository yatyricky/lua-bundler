local FrameUpdate = require("EventCenter").FrameUpdate

local cls = class("Timer")

function cls:ctor(func, duration, loops)
    self.func = func
    self.duration = duration
    self.loops = loops

    self.time = duration
    self.running = false
end

function cls:Start()
    if self.loops == 0 then
        return
    end

    self.running = true
    FrameUpdate:On(self, cls._update)
end

function cls:Stop()
    self.running = false
    FrameUpdate:Off(self, cls._update)
end

function cls:_update(dt)
    if not self.running then
        return
    end

    self.time = self.time - dt
    if self.time <= 1e-14 then
        self.func()

        if self.loops > 0 then
            self.loops = self.loops - 1
            if self.loops == 0 then
                self:Stop()
                return
            end
        end
        self.time = self.time + self.duration
    end
end

return cls
