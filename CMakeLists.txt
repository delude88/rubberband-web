cmake_minimum_required(VERSION 3.21)
project(rubberband_web)

add_compile_options(-ffast-math -O3 -ftree-vectorize)

set(CMAKE_CXX_STANDARD 11)

add_executable(rubberband_web
        src/main.cpp
        src/PitchShifter.cpp
        src/PitchShifter.h)

target_compile_definitions(
        rubberband_web
        PUBLIC
        HAVE_VDSP)

if (APPLE)
    message("Using VDSP on macOS")
    target_link_libraries(
            rubberband_web
            PUBLIC
            "-framework Accelerate"
    )
endif (APPLE)

target_sources(rubberband_web
        PUBLIC
        lib/rubberband/single/RubberBandSingle.cpp
        )

target_include_directories(rubberband_web
        PUBLIC
        lib/rubberband/rubberband
        )