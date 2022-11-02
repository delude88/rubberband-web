#!/bin/bash
# Build the wasm module

# Setup lib
pushd lib || exit
  . setup.sh
popd || exit

# macOS: Install dependencies via brew
if [[ $OSTYPE == 'darwin'* ]]; then
  fetch_brew_dependency() {
      FORMULA_NAME=$1

      echo "Fetching Brew dependency: '$FORMULA_NAME'."

      if brew ls --versions $FORMULA_NAME > /dev/null; then
          echo "Dependency '$FORMULA_NAME' is already installed, continuing ..."
      else
          echo "Dependency '$FORMULA_NAME' is not installed, installing via Homebrew ..."
          brew install $FORMULA_NAME
      fi
  }

  # Install required toolset
  fetch_brew_dependency "cmake"
  fetch_brew_dependency "emscripten"
fi

# Make sure we have a 'build' folder.
mkdir -p build

# Now build
emcmake cmake -B build -S .
echo "Building project ..."
cmake --build build --target rubberband