cmake_minimum_required(VERSION 3.21)
project(wasm)

#if(NOT CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
#    message(FATAL_ERROR "You need to use emscripten for this")
#endif ()

set(CMAKE_CXX_STANDARD 17)
set(OPTIMIZATION_FLAGS "-O3 -flto -std=c++17")
if(CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    set(OPTIMIZATION_FLAGS "${OPTIMIZATION_FLAGS} -Wno-warn-absolute-paths  --profiling")
endif ()
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
        src/RealtimeRubberBand.cpp
        src/RealtimeRubberBand.h
        src/RubberBandSource.cpp
        src/RubberBandSource.h
        src/RubberBandProcessor.cpp
        src/RubberBandProcessor.h
        src/PitchShiftSource.h
        src/RubberBandAPI.cpp
        src/RubberBandAPI.h
        src/RubberBandFinal.cpp
        src/RubberBandFinal.h
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
        -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
        -s ENVIRONMENT=web \
        -s AUTO_JS_LIBRARIES=0 \
        -s FILESYSTEM=0 \
        -s ASSERTIONS=0 \
        -s MODULARIZE=1 \
        -s SINGLE_FILE=1"
        )

# Just some demo testing
add_executable(demo
        src/main.cpp
        )

target_link_libraries(demo
        PRIVATE
        rubberbandclasses
        rubberbandofficial
        )

target_compile_definitions(
        demo
        PUBLIC
        HAVE_VDSP)

if (APPLE)
    message(INFO "Using VDSP on macOS")
    target_link_libraries(
            demo
            PUBLIC
            "-framework Accelerate"
    )
endif (APPLE)

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
        src/RealtimeRubberband_test.cpp
)
target_link_libraries(rubberband_test
        PUBLIC
        GTest::gtest_main
        rubberbandclasses
        rubberbandofficial)

include(GoogleTest)
gtest_discover_tests(rubberband_test)