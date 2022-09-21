//
// Created by Tobias Hegemann on 20.09.22.
//

#include "PitchShifter.h"

#include <algorithm>

const RubberBand::RubberBandStretcher::Options kDefaultOption = RubberBand::RubberBandStretcher::OptionProcessRealTime |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFaster;
const RubberBand::RubberBandStretcher::Options kHighQuality = RubberBand::RubberBandStretcher::OptionProcessRealTime |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

PitchShifter::PitchShifter(size_t sampleRate, size_t channel_count, bool high_quality) :
    latency_(0),
    start_pad_samples_(0),
    start_delay_samples_(0),
    channel_count_(channel_count),
    stretcher_(new RubberBand::RubberBandStretcher(sampleRate, channel_count,
                                                   high_quality ? kHighQuality : kDefaultOption
    )) {
  output_buffer_ = new RubberBand::RingBuffer<float> *[channel_count_];
  scratch_ = new float *[channel_count_];
  auto buffer_size = kBlockSize_ + kReserve_ + 8192;
  for (size_t channel = 0; channel < channel_count_; ++channel) {
    output_buffer_[channel] = new RubberBand::RingBuffer<float>(buffer_size);
    scratch_[channel] = new float[buffer_size];
  }
  updateRatio();
  std::cout << "Pitch shifter created" << std::endl;
}

PitchShifter::~PitchShifter() {
  delete[] output_buffer_;
  delete[] scratch_;
  std::cout << "Pitch shifter destroyed" << std::endl;
}

int PitchShifter::getVersion() {
  return stretcher_->getEngineVersion();
}

void PitchShifter::setTempo(double tempo) {
  if(stretcher_->getTimeRatio() != tempo) {
    fetchProcessed();
    stretcher_->reset();
    stretcher_->setTimeRatio(tempo);
    updateRatio();
  }
}

void PitchShifter::setPitch(double pitch) {
  if(stretcher_->getPitchScale() != pitch) {
    fetchProcessed();
    stretcher_->reset();
    stretcher_->setPitchScale(pitch);
    updateRatio();
  }
}

void PitchShifter::setFormantScale(double scale) {
  if(stretcher_->getFormantScale() != scale) {
    fetchProcessed();
    stretcher_->reset();
    stretcher_->setFormantScale(scale);
    updateRatio();
  }
}

__attribute__((unused)) size_t PitchShifter::getSamplesAvailable() {
  return output_buffer_[0]->getReadSpace();
}

void PitchShifter::push(uintptr_t input_ptr, size_t sample_size) {
  auto *input = reinterpret_cast<float *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
  auto **arr_to_process = new float *[channel_count_];

  if (start_pad_samples_ > 0) {
    // Fill with start pad samples first
    auto **empty = new float *[channel_count_];
    for (size_t channel = 0; channel < channel_count_; ++channel) {
      empty[channel] = new float[start_pad_samples_];
      memset(empty[channel], 0, start_pad_samples_);
    }
    stretcher_->process(empty, sample_size, false);
    delete[] empty;
    start_pad_samples_ = 0;
  }

  for (size_t channel = 0; channel < channel_count_; ++channel) {
    float *source = input + channel * sample_size;
    arr_to_process[channel] = source;
  }
  stretcher_->process(arr_to_process, sample_size, false);
  delete[] arr_to_process;
  fetchProcessed();
}

__attribute__((unused)) void PitchShifter::pull(uintptr_t output_ptr, size_t sample_size) {
  auto *output = reinterpret_cast<float *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
  for (size_t channel = 0; channel < channel_count_; ++channel) {
    size_t available = output_buffer_[channel]->getReadSpace();
    if (available == 0) {
      // (!) BUFFER UNDERRUN
      std::cerr << "BUFFER UNDERRUN" << std::endl;
      return;
    }
    float *destination = output + channel * sample_size;
    output_buffer_[channel]->read(
        destination,
        std::min<size_t>(available, sample_size)
    );
  }
}

void PitchShifter::fetchProcessed() {
  auto available = stretcher_->available();
  if (available > 0) {
    // We have to discard the first start_delay_samples_
    if (start_delay_samples_ > 0) {
      if (available >= start_delay_samples_) {
        stretcher_->retrieve(scratch_, start_delay_samples_);
        available -= start_delay_samples_;
        start_delay_samples_ = 0;
      } else {
        stretcher_->retrieve(scratch_, available);
        start_delay_samples_ -= available;
        return;
      }
    }

    if (output_buffer_[0]->getWriteSpace() <= available) {
      // (!) BUFFER OVERRUN
      std::cerr << "BUFFER OVERRUN" << std::endl;
    }
    size_t actual = stretcher_->retrieve(scratch_, available);
    for (size_t channel = 0; channel < channel_count_; ++channel) {
      output_buffer_[channel]->write(scratch_[channel], actual);
    }
  }
}

int PitchShifter::getLatency() {
  return latency_;
}

void PitchShifter::updateRatio() {
  start_pad_samples_ = stretcher_->getPreferredStartPad();
  start_delay_samples_ = stretcher_->getStartDelay();
}
