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