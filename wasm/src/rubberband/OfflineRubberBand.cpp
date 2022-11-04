//
// Created by Tobias Hegemann on 31.10.22.
//

#include "OfflineRubberBand.h"

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

const size_t kBlockSize = 1024;

OfflineRubberBand::OfflineRubberBand(size_t sample_rate, size_t channel_count) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
}

OfflineRubberBand::~OfflineRubberBand() {
  delete stretcher_;
}

void OfflineRubberBand::study(uintptr_t input_ptr, size_t input_size) {
  auto input = reinterpret_cast<const float *const *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
  auto sub_array_ptr = new const float *;
  const auto channel_count = stretcher_->getChannelCount();
  for (size_t channel = 0; channel < channel_count; ++channel) {
    for (size_t i = 0; i < input_size; i += kBlockSize) {
      auto len = std::min(input_size - i, kBlockSize);
      auto finish = i + kBlockSize > input_size;
      slice(input, sub_array_ptr, channel_count, i);
      stretcher_->study(sub_array_ptr, len, finish);
    }
  }
  delete sub_array_ptr;
}

void OfflineRubberBand::process(uintptr_t input_ptr, size_t sample_size, bool final) {
  processSlice(input_ptr, 0, sample_size, final);
}

void OfflineRubberBand::processSlice(uintptr_t input_ptr, size_t position, size_t sample_size, bool final) {
  auto *input = reinterpret_cast<const float **>(input_ptr); // NOLINT(performance-no-int-to-ptr)
  auto input_slice = new const float *;
  slice(input, input_slice, stretcher_->getChannelCount(), position);
  if(position != 0) {
    stretcher_->process(input_slice, sample_size, final);
  } else {
    input_slice = &input[0];
  }
  delete input_slice;
}

void OfflineRubberBand::retrieve(uintptr_t output_ptr, size_t sample_size) {
  auto output = reinterpret_cast<float **>(output_ptr); // NOLINT(performance-no-int-to-ptr)
  const auto channel_count = stretcher_->getChannelCount();
  for (size_t channel = 0; channel < channel_count; ++channel) {
    stretcher_->retrieve(output, sample_size);
  }
}

void OfflineRubberBand::slice(const float *const *input, const float **output, size_t num_channels, size_t start) {
  for (size_t channel = 0; channel < num_channels; ++channel) {
    output[channel] = input[channel] + start;
  }
}

void OfflineRubberBand::setTempo(double tempo) {
  stretcher_->setTimeRatio(tempo);
}

void OfflineRubberBand::setPitch(double pitch) {
  stretcher_->setPitchScale(pitch);
}

int OfflineRubberBand::getSamplesAvailable() {
  return stretcher_->available();
}
