## Usage

Bundle Lua files into one:

``` sh
lua-bundler f "../test/Main.lua" "../output.lua"
```

Inject to war3map.lua:

``` sh
lua-bundler w "../test/Main.lua" "../war3map.lua"
```

Add ```-p``` to minify bundled lua

``` sh
lua-bundler f "../test/Main.lua" "../output.lua" -p
lua-bundler w "../test/Main.lua" "../war3map.lua" -p
```