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
