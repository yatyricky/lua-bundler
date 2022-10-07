## Usage

Bundle Lua files into one:

``` sh
lua-bundler "./example/src/Main.lua" "./example/dist/bundle.lua"
```

If target file name is `war3map.lua`, inject bundled source to it:

``` sh
lua-bundler "./example/src/Main.lua" "./example/dist/war3map.lua"
```

Add ```-p, --production``` to minify bundled lua

``` sh
lua-bundler "./example/src/Main.lua" "./example/dist/bundle.lua" -p
lua-bundler "./example/src/Main.lua" "./example/dist/war3map.lua" -p
```

Add ```-e, --exclude``` to exclude certain files and directories

``` sh
lua-bundler "./example/src/Main.lua" "./example/dist/bundle.lua" -e "example/src/Reporter.lua"
lua-bundler "./example/src/Main.lua" "./example/dist/bundle.lua" -e "example/src/Reporter.lua;example\src\Dir"
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
