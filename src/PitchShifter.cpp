//
// Created by Tobias Hegemann on 20.09.22.
//

#include "PitchShifter.h"

PitchShifter::PitchShifter(size_t sampleRate, size_t channels) :
    stretcher_(new RubberBand::RubberBandStretcher
                   (sampleRate, channels,
                    RubberBand::RubberBandStretcher::OptionProcessRealTime |
                        RubberBand::RubberBandStretcher::OptionPitchHighConsistency)
    ) {
}

int PitchShifter::getVersion() {
  return stretcher_->getEngineVersion();
}

void PitchShifter::setTempo(double tempo) {
  stretcher_->reset();
  stretcher_->setTimeRatio(tempo);
}

void PitchShifter::setPitch(double pitch) {
  stretcher_->reset();
  stretcher_->setPitchScale(pitch);
}
size_t PitchShifter::getSamplesRequired() {
  return stretcher_->getSamplesRequired();
}
