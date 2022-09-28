cmake_minimum_required(VERSION 3.21)
project(wasm)

if(NOT CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    message(FATAL_ERROR "You need to use emscripten for this")
endif ()

set(CMAKE_CXX_STANDARD 17)
set(OPTIMIZATION_FLAGS "-Wno-warn-absolute-paths -O3 -flto -std=c++17 --profiling")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OPTIMIZATION_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${OPTIMIZATION_FLAGS}")


add_library(rubberbandofficial
        lib/third-party/rubberband-3.0.0/single/RubberBandSingle.cpp
        )

target_include_directories(rubberbandofficial
        PUBLIC
        lib/third-party/rubberband-3.0.0/rubberband)

# Build own library containing MyClass
add_library(rubberbandclasses
        src/OfflineRubberBand.cpp
        src/OfflineRubberBand.h
        src/RealtimeRubberBand.cpp
        src/RealtimeRubberBand.h
        )

target_include_directories(rubberbandclasses
        PUBLIC
        lib/third-party/rubberband-3.0.0/rubberband
        )

# Build final wasm executable
add_executable(rubberband
        src/rubberband.cc
        )

target_include_directories(rubberband
        PUBLIC
        lib/third-party/rubberband-3.0.0/rubberband
        )

target_link_libraries(rubberband
        PUBLIC
        rubberbandclasses
        rubberbandofficial
        embind
        )

set_target_properties(rubberband
        PROPERTIES
        LINK_FLAGS
        "${OPTIMIZATION_FLAGS} \
        -s WASM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s BINARYEN_ASYNC_COMPILATION=0 \
        -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
        -s AUTO_JS_LIBRARIES=0 \
        -s FILESYSTEM=0 \
        -s ASSERTIONS=0 \
        -s SINGLE_FILE=1 \
        -O1 \
        --post-js ${CMAKE_SOURCE_DIR}/em-es6-module.js"
        )


###############################
#
# Rubberband library API tests
#
###############################
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG release-1.12.1
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_executable(
        rubberband_test
        src/OfflineRubberBand_test.cpp
        src/RealtimeRubberband_test.cpp
)
target_link_libraries(rubberband_test
        PUBLIC
        GTest::gtest_main
        rubberbandclasses
        rubberbandofficial)

include(GoogleTest)
gtest_discover_tests(rubberband_test)