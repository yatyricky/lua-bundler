require("class")

---@class Event
local cls = class("Event")

function cls:ctor()
    self._handlers = {}
end

---@generic T, E
---@param context T
---@param listener fun(context: T, data: E)
function cls:On(context, listener)
    local map = self._handlers[context]
    if map == nil then
        map = {}
        self._handlers[context] = map
    end
    map[listener] = 1
end

---@generic T, E
---@param context T
---@param listener fun(context: T, data: E)
function cls:Off(context, listener)
    local map = self._handlers[context]
    if map == nil then
        return
    end
    map[listener] = nil
    if next(map) == nil then
        self._handlers[context] = nil
    end
end

---@generic E
---@param data E
function cls:Emit(data)
    for context, map in pairs(self._handlers) do
        for listener, _ in pairs(map) do
            listener(context, data)
        end
    end
end

local function f2s(func)
    local info = debug.getinfo(func, "S")
    if info.what == "C" then
        return "CFunc:" .. so
    else
        return string.format("%s:%s-%s", info.source, info.linedefined, info.lastlinedefined)
    end
end

function cls:ToString()
    local sb = {}
    for context, map in pairs(self._handlers) do
        for listener, _ in pairs(map) do
            table.insert(sb, string.format("%s -> %s", tostring(context), f2s(listener)))
        end
    end
    return table.concat(sb, ",")
end

return cls
