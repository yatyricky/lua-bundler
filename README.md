## Usage

Bundle Lua files into one:

``` sh
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua"
```

If target file name is `war3map.lua`, inject bundled source to it:

``` sh
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/war3map.lua"
```

Add ```-p, --production``` to minify bundled lua

``` sh
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua" -p
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/war3map.lua" -p
```

Add ```-e, --exclude``` to exclude certain files and directories

``` sh
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua" -e "example/src/Reporter.lua"
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua" -e "example/src/Reporter.lua;example\src\Dir"
```

Add ```-d, --define``` to pass define flags for conditional compilation

``` sh
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua" -d "DEBUG"
lua-bundler -i "./example/src/Main.lua" -o "./example/dist/bundle.lua" -d "DEBUG;FEATURE_X"
```

Blocks wrapped in `--#IF FLAG THEN` / `--#END` are included only when the flag is defined. Expressions support `AND`, `OR`, `NOT`, and parentheses:

```lua
--#IF DEBUG THEN
print("debug mode")
--#END

--#IF FEATURE_X AND NOT DEBUG THEN
-- only included when FEATURE_X is defined and DEBUG is not
--#END
```

## Require flavours

```lua
local Module = require("Modules.Module") -- recommended
require("Modules/Module")
require "Modules.Module"
```

## Build with pkg

e.g.
`pkg . -t node16-win-x64`
