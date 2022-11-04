//
// Created by Tobias Hegemann on 03.11.22.
//

#include <iostream>
#include "RubberBandFinal.h"

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandFinal::RubberBandFinal(size_t sample_rate,
                                 size_t channel_count,
                                 size_t sample_count,
                                 double time_ratio,
                                 double pitch_scale) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
  stretcher_->setTimeRatio(time_ratio);
  stretcher_->setPitchScale(pitch_scale);
  input_size_ = sample_count;
  output_size_ = sample_count * time_ratio; // NOLINT(cppcoreguidelines-narrowing-conversions)
  input_ = new float *[channel_count];
  output_ = new float *[channel_count];
  output_buffer_ = new float *[channel_count];
  input_buffer_ = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    input_[channel] = new float[input_size_];
    output_[channel] = new float[output_size_];
    input_buffer_[channel] = new float[8192];
    output_buffer_[channel] = new float[8192];
  }
}

RubberBandFinal::~RubberBandFinal() {
  delete stretcher_;
  delete[] input_;
  delete[] output_;
  delete[] input_buffer_;
  delete[] output_buffer_;
}

void RubberBandFinal::push(uintptr_t input_ptr, size_t input_size) {
  auto input = reinterpret_cast<float **>(input_ptr);
  // Build up internal array since final is signaled
  for (size_t channel = 0; channel < stretcher_->getChannelCount(); ++channel) {
    for (size_t sample = 0; sample < input_size; ++sample) {
      //TODO: THIS WILL BREAK:
      auto value = input[channel][sample];
      // END OF TODO
      input_[channel][input_write_pos_ + sample] = value;
    }
  }
  input_write_pos_ += input_size;
  /*
  const auto final = input_write_pos_ >= input_size_;
  stretcher_->study(input, input_size, final);
  if (final) {
    // End reached, process all now
    size_t sample_required = stretcher_->getSamplesRequired();
    while (sample_required > 0) {
      for (size_t channel = 0; channel < stretcher_->getChannelCount(); ++channel) {
        input_buffer_[channel] = input_[channel] + input_process_pos_;
      }
      stretcher_->process(input_buffer_, sample_required, input_process_pos_ + sample_required >= input_size_);
      input_process_pos_ += sample_required;
      fetch();
      sample_required = stretcher_->getSamplesRequired();
    }
    fetch();
  }*/
}

bool RubberBandFinal::pull(uintptr_t output_ptr, size_t output_size) {
  auto output = reinterpret_cast<float **>(output_ptr);
  for (size_t channel = 0; channel < stretcher_->getChannelCount(); ++channel) {
    output[channel] = output_[channel] + output_read_pos_;
  }
  output_read_pos_ += output_size;
  return output_read_pos_ >= output_size;
}

void RubberBandFinal::fetch() {
  auto input_buffer = new const float *;
  auto available = stretcher_->available();
  while (available > 0) {
    auto actual = stretcher_->retrieve(output_buffer_, available);
    for (size_t channel = 0; channel < stretcher_->getChannelCount(); ++channel) {
      for (size_t sample = 0; sample < actual; ++sample) {
        output_[channel][output_write_pos_ + sample] = output_buffer_[channel][sample];
      }
    }
    output_write_pos_ += actual;
    available = stretcher_->available();
  }
}

