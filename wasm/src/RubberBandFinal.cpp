//
// Created by Tobias Hegemann on 03.11.22.
//

#include "RubberBandFinal.h"

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandFinal::RubberBandFinal(size_t sample_rate,
                                 size_t channel_count,
                                 double time_ratio,
                                 double pitch_scale) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
  stretcher_->setTimeRatio(time_ratio);
  stretcher_->setPitchScale(pitch_scale);
  output_buffer_ = new float *[channel_count];
  auto buffer_size = 8192 * 2;
  for (size_t channel = 0; channel < channel_count; ++channel) {
    output_buffer_[channel] = new float[buffer_size];
  }
}

RubberBandFinal::~RubberBandFinal() {
  delete stretcher_;
  delete[] output_buffer_;
  delete[] output_;
}

size_t RubberBandFinal::process(uintptr_t input_ptr, size_t input_size) {
  input_ = reinterpret_cast<const float *const *>(input_ptr);
  input_size_ = input_size;
  output_size_ = input_size_ * stretcher_->getTimeRatio(); // NOLINT(cppcoreguidelines-narrowing-conversions)
  delete[] output_;
  auto channel_count = stretcher_->getChannelCount();
  output_ = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    output_[channel] = new float[output_size_];
  }

  // Study whole input
  stretcher_->study(input_, input_size_, true);

  // Process as required
  processRequiredSamples();

  return output_size_;
}

void RubberBandFinal::processRequiredSamples() {
  size_t samples_required = stretcher_->getSamplesRequired();
  auto channel_count = stretcher_->getChannelCount();
  while (samples_required > 0) {
    auto input_buffer = new const float *;
    for (size_t channel = 0; channel < channel_count; ++channel) {
      input_buffer[channel] = input_[channel] + input_counter_;
    }
    input_counter_ += samples_required;
    stretcher_->process(input_buffer, samples_required, input_counter_ >= input_size_);
    samples_required = stretcher_->getSamplesRequired();
  }
  size_t available = stretcher_->available();
  while (available > 0) {
    stretcher_->retrieve(output_buffer_, samples_required, output_counter_ >= input_size_);
    available = stretcher_->available();
  }
}
