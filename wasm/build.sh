#!/bin/bash

pushd lib || exit
  . setup.sh
popd || exit

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
pushd lib || exit
  bash setup.sh
popd || exit

# Make sure we have a 'build' folder.
if [ ! -d "build" ]; then
    mkdir build
fi

# Build using emscripten shipped by brew and cmake
EMSCRIPTEN=$(brew --prefix emscripten)
EMSCRIPTEN_CMAKE_PATH=${EMSCRIPTEN}/libexec/cmake/Modules/Platform/Emscripten.cmake
pushd build || exit
  echo "Emscripten CMake path: ${EMSCRIPTEN_CMAKE_PATH}"
  cmake -DCMAKE_TOOLCHAIN_FILE=${EMSCRIPTEN_CMAKE_PATH} ..
  echo "Building project ..."
  make
popd || exit