#include "emscripten/bind.h"
#include "../cpp/OfflineRubberBand.h"
#include "../cpp/RealtimeRubberBand.h"

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


EMSCRIPTEN_BINDINGS(CLASS_OfflineRubberBand) {
    class_<OfflineRubberband>("OfflineRubberBand")

        .constructor<size_t, size_t, bool>()

        .function("getVersion",
                  &OfflineRubberBand::getVersion)

        .function("setPitch",
                  &OfflineRubberBand::setPitch)

        .function("setTempo",
                  &OfflineRubberBand::setTempo)

        .function("setFormantScale",
                  &OfflineRubberBand::setFormantScale)

        .function("pull",
                  &OfflineRubberBand::pull,
                  allow_raw_pointers())

        .function("push",
                  &OfflineRubberBand::push,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &OfflineRubberBand::getSamplesAvailable);
}