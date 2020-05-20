## Usage

Bundle Lua files into one:

``` sh
lua-bundler f "../test/Main.lua" "../output.lua"
```

Inject to war3map.lua:

``` sh
lua-bundler w "../test/Main.lua" "../war3map.lua"
```

Add ```-p``` (production) to minify bundled lua

``` sh
lua-bundler f "../test/Main.lua" "../output.lua" -p
lua-bundler w "../test/Main.lua" "../war3map.lua" -p
```

## Require flavours

```lua
require("Modules/Module")
require "Modules.Module"
```

## Build with pkg

e.g.
`pkg . -t node12-win-x64`
