#include "emscripten/bind.h"
#include "../src/PitchShifter.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(CLASS_Pitchshifter) {
    class_<PitchShifter>("PitchShifter")

        .constructor<size_t, size_t, bool>()

        .function("getVersion",
                  &PitchShifter::getVersion)

        .function("setPitch",
                  &PitchShifter::setPitch)

        .function("setTempo",
                  &PitchShifter::setTempo)

        .function("setFormantScale",
                  &PitchShifter::setFormantScale)

        .function("pull",
                  &PitchShifter::pull,
                  allow_raw_pointers())

        .function("push",
                  &PitchShifter::push,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &PitchShifter::getSamplesAvailable);
}