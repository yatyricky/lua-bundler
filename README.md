## Usage

Bundle Lua files into one:

``` sh
lua-bundler f "./example/src/Main.lua" "./example/dist/bundle.lua"
```

Inject to war3map.lua:

``` sh
lua-bundler w "./example/src/Main.lua" "./example/dist/war3map.lua"
```

Add ```-p``` (production) to minify bundled lua

``` sh
lua-bundler f "./example/src/Main.lua" "./example/dist/bundle.lua" -p
lua-bundler w "./example/src/Main.lua" "./example/dist/war3map.lua" -p
```

## Require flavours

```lua
require("Modules/Module")
require "Modules.Module"
```

## Build with pkg

e.g.
`pkg . -t node12-win-x64`
