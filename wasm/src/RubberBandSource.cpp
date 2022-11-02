//
// Created by Tobias Hegemann on 31.10.22.
//

#include "RubberBandSource.h"
#include <iostream>

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandSource::RubberBandSource(size_t sample_rate, size_t channel_count, size_t pre_process_size)
    : pre_process_size_(pre_process_size),
      input_(nullptr),
      input_size_(0),
      pre_process_position_(0),
      play_position_(0),
      output_size_(0) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
  process_buffer_ = new float *[channel_count];
  for (size_t c = 0; c < channel_count; ++c) {
    process_buffer_[c] = new float[kRenderQuantumFrames];
  }
}

RubberBandSource::~RubberBandSource() {
  delete stretcher_;
  delete[] process_buffer_;
}

void RubberBandSource::setTimeRatio(double time_ratio) {
  stretcher_->reset();
  stretcher_->setTimeRatio(time_ratio);
  output_size_ = input_size_ * stretcher_->getTimeRatio(); // NOLINT(cppcoreguidelines-narrowing-conversions)
  restart();
}

void RubberBandSource::setPitchScale(double pitch_scale) {
  stretcher_->reset();
  stretcher_->setPitchScale(pitch_scale);
  restart();
}

void RubberBandSource::setBuffer(uintptr_t input_ptr, size_t input_size) {
  stretcher_->reset();
  // Analyze first
  input_ = (const float *const *) input_ptr;
  input_size_ = input_size;
  output_size_ = input_size_ * stretcher_->getTimeRatio(); // NOLINT(cppcoreguidelines-narrowing-conversions)
  restart();
}

size_t RubberBandSource::retrieve(uintptr_t output_ptr) {
  size_t received = 0;
  if (play_position_ < output_size_) {
    auto available = stretcher_->available();
    if (available < kRenderQuantumFrames) {
      std::cerr << "WARNING: only " << available << " of requested " << kRenderQuantumFrames << " samples available"
                << std::endl;
      std::cerr << "play_position_ = " << play_position_ << " pre_process_position_ = " << pre_process_position_
                << std::endl;
    } else {
    }
    auto output = (float *const *) output_ptr;
    received = stretcher_->retrieve(output, std::min(available, (int) kRenderQuantumFrames));
    play_position_ += received;
    // Pre-process
    process(kRenderQuantumFrames);
  }
  return received;
}

void RubberBandSource::reset() {
  stretcher_->reset();
  restart();
}

void RubberBandSource::restart() {
  pre_process_position_ = 0;
  play_position_ = 0;
  // Study whole buffer using internal block size per iteration
  stretcher_->study(input_, input_size_, true);
  // Pre-process
  process(pre_process_size_);
}

void RubberBandSource::process(size_t sample_size) {
  auto length = std::min(input_size_ - pre_process_position_, sample_size);
  if (length > 0) {
    const auto channel_count = stretcher_->getChannelCount();
    bool finish = false;

    // From pre_process_position_

    for (size_t frame = 0; frame < length; frame += kRenderQuantumFrames) {
      auto frameLength = std::min(input_size_ - pre_process_position_ - frame, kRenderQuantumFrames);

      for (size_t channel = 0; channel < channel_count; ++channel) {
        for (int sample = 0; sample < frameLength; ++sample) {
          process_buffer_[channel][sample] = input_[channel][pre_process_position_ + frame + sample];
        }
      }
      // Process current frame
      finish = pre_process_position_ + frame + kRenderQuantumFrames >= input_size_;
      stretcher_->process(process_buffer_, frameLength, finish);
    }
  }
  pre_process_position_ += length;
  /*
  auto length = std::min(input_size_ - pre_process_position_, sample_size);
  if (length > 0) {
    auto channel_count = stretcher_->getChannelCount();

    //auto sub_array_ptr = new const float *;
    auto samples_required = stretcher_->getSamplesRequired();
    for (size_t i = 0; i < length && samples_required > 0; i += samples_required) {
      auto position = pre_process_position_ + i;
      auto finish = position + samples_required >= input_size_;

      for (size_t c = 0; c < channels; ++c) {
        for (int i = 0; i < count; ++i) {
          cbuf[c][i] = ibuf[i * channels + c];
        }
      }

      for (size_t channel = 0; channel < channel_count; ++channel) {
        const float *source = input_[channel] + position;
        sub_array_ptr[channel] = source;
      }

      stretcher_->process(sub_array_ptr, samples_required, finish);
    }
    //delete[] sub_array_ptr;
  }
  pre_process_position_ += length;
   */
}

int RubberBandSource::getSamplesAvailable() {
  return stretcher_->available();
}

size_t RubberBandSource::getInputSize() const {
  return input_size_;
}
size_t RubberBandSource::getOutputSize() const {
  return output_size_;
}
