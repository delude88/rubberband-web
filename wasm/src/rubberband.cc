#include "emscripten/bind.h"
#include "RealtimeRubberBand.h"
#include "RubberBandProcessor.h"

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

        .function("pull",
                  &RealtimeRubberBand::pull,
                  allow_raw_pointers())

        .function("push",
                  &RealtimeRubberBand::push,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &RealtimeRubberBand::getSamplesAvailable);
}

EMSCRIPTEN_BINDINGS(CLASS_RubberBandProcessor) {
    class_<RubberBandProcessor>("RubberBandProcessor")

        .constructor<size_t, size_t, double, double>()

        .function("getOutputSize",
                  &RubberBandProcessor::get_output_size)

        .function("process",
                  &RubberBandProcessor::process,
                  allow_raw_pointers());
}
