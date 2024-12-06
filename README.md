# code-performance-analyzer README

## Features

- LLM-based Big O Analysis of code 
- AST/LLVM Big O Analysis of code

## Requirements

## FFI module

Install FFI module (if is not yet installed). On mac it should be installed like this:

### 1. Install libffi

You need to install the libffi development package. On macOS, you can do this using Homebrew:

```bash
brew install libffi
```

### 2. Set Environment Variables

After installing libffi, you may need to set some environment variables to help the build process find it. Try running:

```bash
export LDFLAGS="-L$(brew --prefix libffi)/lib"
export CPPFLAGS="-I$(brew --prefix libffi)/include"
```

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues


## Release Notes

### 0.0.2

Initial Release
---

