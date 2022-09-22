#include "emscripten/bind.h"
#include "../cpp/OfflineRubberband.h"
#include "../cpp/RealtimeRubberband.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(CLASS_RealtimeRubberband) {
    class_<RealtimeRubberband>("RealtimeRubberband")

        .constructor<size_t, size_t, bool>()

        .function("getVersion",
                  &RealtimeRubberband::getVersion)

        .function("setPitch",
                  &RealtimeRubberband::setPitch)

        .function("setTempo",
                  &RealtimeRubberband::setTempo)

        .function("setFormantScale",
                  &RealtimeRubberband::setFormantScale)

        .function("pull",
                  &RealtimeRubberband::pull,
                  allow_raw_pointers())

        .function("push",
                  &RealtimeRubberband::push,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &RealtimeRubberband::getSamplesAvailable);
}


EMSCRIPTEN_BINDINGS(CLASS_OfflineRubberband) {
    class_<OfflineRubberband>("OfflineRubberband")

        .constructor<size_t, size_t, bool>()

        .function("getVersion",
                  &OfflineRubberband::getVersion)

        .function("setPitch",
                  &OfflineRubberband::setPitch)

        .function("setTempo",
                  &OfflineRubberband::setTempo)

        .function("setFormantScale",
                  &OfflineRubberband::setFormantScale)

        .function("pull",
                  &OfflineRubberband::pull,
                  allow_raw_pointers())

        .function("push",
                  &OfflineRubberband::push,
                  allow_raw_pointers())

        .function("getSamplesAvailable",
                  &OfflineRubberband::getSamplesAvailable);
}