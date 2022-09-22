#!/bin/sh

export RUBBERBAND_VERSION="3.0.0"

# Download and extract rubberband
if [ ! -d lib/rubberband ]; then
  echo "(0/4) Preparing build by fetching rubberband"
  mkdir -p lib
  curl -o lib/rubberband.tar.bz2 https://breakfastquay.com/files/releases/rubberband-${RUBBERBAND_VERSION}.tar.bz2
  tar xmf lib/rubberband.tar.bz2 -C lib
  mv -v lib/rubberband-${RUBBERBAND_VERSION} lib/rubberband
fi

# Prepare environment
export OPTIMIZATION="-O3 -msimd128 -flto -fno-rtti"
export CFLAGS="-Ilib/rubberband/rubberband ${OPTIMIZATION}"
export CXXFLAGS="${CFLAGS}"
export LDFLAGS="${CFLAGS}"

# Compile RubberBandSingle as lib
echo "(1/4) Compiling rubberband library"
emcc ${CXXFLAGS} -c lib/rubberband/single/RubberBandSingle.cpp -o lib/librubberband.o

# Compile PitchShifter.cpp
echo "(2/4) Compiling classes"
emcc ${CXXFLAGS} -c src/cpp/OfflineRubberBand.cpp -o lib/offlinerubberband.o
emcc ${CXXFLAGS} -c src/cpp/RealtimeRubberBand.cpp -o lib/realtimerubberband.o

# Compile rubberband.cc
echo "(3/4) Compiling WASM interface"
emcc ${CXXFLAGS} -DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0 -c src/wasm/rubberband.cc -o lib/rubberband.o

# Link both
echo "(4/4) Linking everything into an beautiful WASM module"
mkdir -p dist
emcc ${LDFLAGS} \
      --bind \
      -O1 \
      -s WASM=1 \
      -s BINARYEN_ASYNC_COMPILATION=0 \
      -s ALLOW_MEMORY_GROWTH=1 \
      -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
      -s AUTO_JS_LIBRARIES=0 \
      -s FILESYSTEM=0 \
      -s ASSERTIONS=0 \
      -s SINGLE_FILE=1 \
      lib/librubberband.o \
      lib/offlinerubberband.o \
      lib/realtimerubberband.o \
      lib/rubberband.o \
      -o src/audioworklet/rubberband.wasmmodule.js \
      --post-js ./em-es6-module.js

# Build safari test
echo "(5/4) Safari test"
#emcc --bind -s BINARYEN_ASYNC_COMPILATION=0 -s SIDE_MODULE=1 src/wasm/test.cpp -o dist/hello.js
emcc --bind -std=c++11 -Os -s WASM=1 -s BINARYEN_ASYNC_COMPILATION=0 -s SIDE_MODULE=1 src/wasm/test.cpp -o dist/hello.wasm