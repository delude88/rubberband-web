#!/bin/sh

export RUBBERBAND_VERSION="3.0.0"

# Download and extract rubberband
if [ ! -d lib/rubberband ]; then
  mkdir -p lib
  curl -o lib/rubberband.tar.bz2 https://breakfastquay.com/files/releases/rubberband-${RUBBERBAND_VERSION}.tar.bz2
  tar xmf lib/rubberband.tar.bz2 -C lib
  mv -v lib/rubberband-${RUBBERBAND_VERSION} lib/rubberband
fi

# Prepare environment
#export OPTIMIZATION="-O3 -Oz"
#export OPTIMIZATION="-O3 -msimd128 -flto"
export OPTIMIZATION="-O3 -msimd128 -flto -fno-rtti"
export CFLAGS="-Ilib/rubberband/rubberband ${OPTIMIZATION}"
export CXXFLAGS="${CFLAGS}"
export LDFLAGS="${CFLAGS}"

# Compile RubberBandSingle as lib
echo "Compiling RubberBandSingle as lib"
emcc ${CXXFLAGS} -c lib/rubberband/single/RubberBandSingle.cpp -o lib/librubberband.o

# Compile PitchShifter.cpp
echo "Compile PitchShifter.cpp"
emcc ${CXXFLAGS} -c src/PitchShifter.cpp -o lib/pitchshifter.o

# Compile rubberband.cc
echo "Compile rubberband.cc"
emcc ${CXXFLAGS} -DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0 -c src/rubberband.cc -o lib/rubberband.o

# Link both
echo "Linking"
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
      lib/rubberband.o \
      lib/pitchshifter.o \
      -o dist/rubberband.wasmmodule.js \
      --post-js ./em-es6-module.js

echo "Copying"
cp -fr dist/rubberband.wasmmodule.js src/rubberband.wasmmodule.js