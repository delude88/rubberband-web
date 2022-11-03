//
// Created by Tobias Hegemann on 02.11.22.
//

#include <iostream>
#include "RubberBandAPI.h"

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandAPI::RubberBandAPI(size_t sample_rate,
                             size_t channel_count,
                             double time_ratio,
                             double pitch_scale,
                             size_t sample_size) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
  stretcher_->setTimeRatio(time_ratio);
  stretcher_->setPitchScale(pitch_scale);
  stretcher_->setMaxProcessSize(sample_size);
}

RubberBandAPI::~RubberBandAPI() {
  delete stretcher_;
}

void RubberBandAPI::study(uintptr_t input_ptr, size_t input_size, bool final) {
  stretcher_->study(reinterpret_cast<const float *const *>(input_ptr), input_size, final);
}

void RubberBandAPI::process(uintptr_t input_ptr, size_t input_size, bool final) {
  stretcher_->process(reinterpret_cast<const float *const *>(input_ptr), input_size, final);
}

size_t RubberBandAPI::retrieve(uintptr_t output_ptr, size_t output_size) {
  return stretcher_->retrieve(reinterpret_cast<float *const *>(output_ptr),
                              output_size);  //TODO: Or std::min(stretcher_->available(), output_size) ?
}

size_t RubberBandAPI::getSamplesRequired() const {
  return stretcher_->getSamplesRequired();
}

size_t RubberBandAPI::available() const {
  return stretcher_->available();
}
void RubberBandAPI::setMaxProcessSize(size_t size) const {
  stretcher_->setMaxProcessSize(size);
}
