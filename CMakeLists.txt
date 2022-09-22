cmake_minimum_required(VERSION 3.21)
project(rubberband_web)
set(CMAKE_CXX_STANDARD 11)

#add_compile_options(-ffast-math -O3 -ftree-vectorize)


###############################
#
# Rubberband library API
#
###############################
add_library(rubberband
        src/cpp/RealtimeRubberBand.cpp
        src/cpp/RealtimeRubberBand.h
        src/cpp/OfflineRubberBand.cpp
        src/cpp/OfflineRubberBand.h)

target_compile_options(
        rubberband
        PRIVATE
        -ffast-math -O3 -ftree-vectorize
)

target_sources(rubberband
        PRIVATE
        lib/rubberband/single/RubberBandSingle.cpp
        )

target_include_directories(rubberband
        PUBLIC
        lib/rubberband/rubberband
        )

target_compile_definitions(
        rubberband
        PRIVATE
        HAVE_VDSP)

if (APPLE)
    message("Using VDSP on macOS")
    target_link_libraries(
            rubberband
            PRIVATE
            "-framework Accelerate"
    )
endif (APPLE)


###############################
#
# Rubberband library API tests
#
###############################
# gtest
include(FetchContent)
FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG release-1.12.1
)
FetchContent_MakeAvailable(googletest)
add_library(GTest::GTest INTERFACE IMPORTED)
target_link_libraries(GTest::GTest INTERFACE gtest_main)

enable_testing()
find_package(GTest REQUIRED)
add_executable(
        rubberband_test
        src/cpp/OfflineRubberBand_test.cpp
        src/cpp/RealtimeRubberband_test.cpp
)
target_link_libraries(rubberband_test PRIVATE GTest::GTest rubberband)
gtest_discover_tests(rubberband_test)


###############################
#
# Demo application
#
###############################
add_executable(demo
        src/demo.cpp)

target_link_libraries(demo
        PUBLIC
        rubberband
        )