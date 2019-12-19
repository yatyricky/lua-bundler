
local __modules = {}
local require = function(path)
    local module = __modules[path]
    if module ~= nil then
        if not module.inited then
            module.cached = module.loader()
            module.inited = true
        end
        return module.cached
    else
        error("module not found")
        return nil
    end
end

----------------
__modules["Main"] = { inited = false, cached = false, loader = function(...)
---- START Main.lua ----
require("Class")
require("Clone")
local Logger = require("Manager/Logger")

local logger = Logger.GetInstance()
logger:Log("main log")


local Widget = require("Artifact/Widget")
local widget = Widget.new()
widget:Run()
local Player = require("Artifact/Player")
local Player = Player.new()
Player:Run()

---- END Main.lua ----
 end}
----------------
__modules["Class"] = { inited = false, cached = false, loader = function(...)
---- START Class.lua ----
function class(classname, super)  
    local superType = type(super)  
    local cls   
    if superType ~= "function" and superType ~= "table" then  
        superType = nil  
        super = nil  
    end  
    if superType == "function" or (super and super.__ctype == 1) then   
        cls = {}  
        if superType == "table" then  
            for k,v in pairs(super) do cls[k] = v end  
            cls.__create = super.__create  
            cls.super    = super  
        else   
            cls.__create = super  
        end  
        cls.ctor = function() end  
        cls.__cname = classname  
        cls.__ctype = 1  
        function cls.new(...)  
            local instance = cls.__create(...)  
            for k,v in pairs(cls) do instance[k] = v end  
            instance.class = cls  
            instance:ctor(...)  
            return instance  
        end  
    else  
        if super then  
            cls = clone(super)  
            cls.super = super  
        else  
            cls = {ctor = function() end}  
        end  
  
        cls.__cname = classname  
        cls.__ctype = 2  
        cls.__index = cls
        function cls.new(...)  
            local instance = setmetatable({}, cls)  
            instance.class = cls  
            instance:ctor(...)  
            return instance  
        end  
    end  
    return cls  
end

---- END Class.lua ----
 end}
----------------
__modules["Clone"] = { inited = false, cached = false, loader = function(...)
---- START Clone.lua ----
function clone(object)
	local lookup_table = {}
	local function _copy(object)
		if type(object) ~= "table" then 
			return object 
		elseif lookup_table[object] then
			return lookup_table[object]
		end
		local new_table = {}
		lookup_table[object] = new_table
		for key, value in pairs(object) do
			new_table[_copy(key)] = _copy(value)
		end
		return setmetatable(new_table, getmetatable(object))
	end
	return _copy(object)
end

---- END Clone.lua ----
 end}
----------------
__modules["Manager/Logger"] = { inited = false, cached = false, loader = function(...)
---- START Manager/Logger.lua ----
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
---- END Manager/Logger.lua ----
 end}
----------------
__modules["Manager/Attributes"] = { inited = false, cached = false, loader = function(...)
---- START Manager/Attributes.lua ----
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
---- END Manager/Attributes.lua ----
 end}
----------------
__modules["Artifact/Widget"] = { inited = false, cached = false, loader = function(...)
---- START Artifact/Widget.lua ----
local Widget = class("Widget")

function Widget:ctor()
    self.type = "Widget"
end

function Widget:Run()
    print("I'm" .. self.type)
end
return Widget
---- END Artifact/Widget.lua ----
 end}
----------------
__modules["Artifact/Player"] = { inited = false, cached = false, loader = function(...)
---- START Artifact/Player.lua ----
local Widget = require("Artifact/Widget")
local Player = class("Player", Widget)

function Player:ctor()
    Player.super.ctor(self)
    self.type = "Player"
    self.other = "11"
end

function Player:Run()
    print("I'm" .. self.type .. self.other)
end
return Player
---- END Artifact/Player.lua ----
 end}__modules["Main"].loader()