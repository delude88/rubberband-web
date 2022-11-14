#include "emscripten/bind.h"
#include "rubberband/RealtimeRubberBand.h"
#include "rubberband/RubberBandProcessor.h"
#include "rubberband/RubberBandSource.h"
#include "rubberband/RubberBandAPI.h"
#include "rubberband/RubberBandFinal.h"
#include "test/Test.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(CLASS_RealtimeRubberBand) {
    class_<RealtimeRubberBand>("RealtimeRubberBand")

        .constructor<size_t, size_t, bool>()

        .function("getVersion",
                  &RealtimeRubberBand::getVersion)

        .function("setPitch",
                  &RealtimeRubberBand::setPitch)

        .function("setTempo",
                  &RealtimeRubberBand::setTempo)

        .function("setFormantScale",
                  &RealtimeRubberBand::setFormantScale)

        .function("push",
                  &RealtimeRubberBand::push,
                  allow_raw_pointers())

        .function("pull",
                  &RealtimeRubberBand::pull,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &RealtimeRubberBand::getSamplesAvailable);
}

EMSCRIPTEN_BINDINGS(CLASS_RubberBandProcessor) {
    class_<RubberBandProcessor>("RubberBandProcessor")

        .constructor<size_t, size_t, double, double>()

        .function("getOutputSize",
                  &RubberBandProcessor::getOutputSize)

        .function("setBuffer",
                  &RubberBandProcessor::setBuffer,
                  allow_raw_pointers())

        .function("retrieve",
                  &RubberBandProcessor::retrieve,
                  allow_raw_pointers());
}

EMSCRIPTEN_BINDINGS(CLASS_RubberBandSource) {
    class_<RubberBandSource>("RubberBandSource")

        .constructor<size_t, size_t, size_t>()

        .function("getSamplesAvailable",
                  &RubberBandSource::getSamplesAvailable)

        .function("getInputSize",
                  &RubberBandSource::getInputSize)

        .function("getOutputSize",
                  &RubberBandSource::getOutputSize)

        .function("setTimeRatio",
                  &RubberBandSource::setTimeRatio)

        .function("setPitchScale",
                  &RubberBandSource::setPitchScale)

        .function("reset",
                  &RubberBandSource::reset)

        .function("setBuffer",
                  &RubberBandSource::setBuffer,
                  allow_raw_pointers())

        .function("retrieve",
                  &RubberBandSource::retrieve,
                  allow_raw_pointers());
}

EMSCRIPTEN_BINDINGS(CLASS_RubberBandAPI) {
    class_<RubberBandAPI>("RubberBandAPI")

        .constructor<size_t, size_t, double, double>()

        .function("study",
                  &RubberBandAPI::study,
                  allow_raw_pointers())

        .function("process",
                  &RubberBandAPI::process,
                  allow_raw_pointers())

        .function("retrieve",
                  &RubberBandAPI::retrieve,
                  allow_raw_pointers())

        .function("available",
                  &RubberBandAPI::available)

        .function("getSamplesRequired",
                  &RubberBandAPI::getSamplesRequired)

        .function("setMaxProcessSize",
                  &RubberBandAPI::setMaxProcessSize);
}

EMSCRIPTEN_BINDINGS(CLASS_RubberBandFinal) {
    class_<RubberBandFinal>("RubberBandFinal")

        .constructor<size_t, size_t, size_t, double, double>()

        .function("push",
                  &RubberBandFinal::push,
                  allow_raw_pointers())

        .function("pull",
                  &RubberBandFinal::pull,
                  allow_raw_pointers());
}

EMSCRIPTEN_BINDINGS(CLASS_Test) {
    class_<Test>("Test")

        .constructor<float>()

        .function("getFactor",
                  &Test::getFactor)

        .function("setFactor",
                  &Test::setFactor)

        .function("getEpsilon",
                  &Test::getEpsilon)

        .function("setEpsilon",
                  &Test::setEpsilon)

        .function("push",
                  &Test::push,
                  allow_raw_pointers())

        .function("pull",
                  &Test::pull,
                  allow_raw_pointers());
}