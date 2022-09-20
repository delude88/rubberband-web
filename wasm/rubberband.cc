#include "emscripten/bind.h"
#include "../src/PitchShifter.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(CLASS_Pitchshifter) {
  class_<PitchShifter>("PitchShifter")
      .constructor<size_t, size_t>()
      .function("getVersion",
                &PitchShifter::getVersion)

      .function("getSamplesRequired",
                &PitchShifter::getSamplesRequired)

      .function("setPitch",
                &PitchShifter::setPitch)

      .function("setTempo",
                &PitchShifter::setTempo);
}