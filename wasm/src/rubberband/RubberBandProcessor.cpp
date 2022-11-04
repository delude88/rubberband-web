
#include "RubberBandProcessor.h"

const RubberBand::RubberBandStretcher::Options kOptions = RubberBand::RubberBandStretcher::OptionProcessOffline |
    RubberBand::RubberBandStretcher::OptionPitchHighConsistency |
    RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandProcessor::RubberBandProcessor(size_t sample_rate,
                                         size_t channel_count,
                                         double time_ratio,
                                         double pitch_scale) {
  stretcher_ = new RubberBand::RubberBandStretcher(sample_rate, channel_count, kOptions);
  stretcher_->setTimeRatio(time_ratio);
  stretcher_->setPitchScale(pitch_scale);
  scratch_ = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    scratch_[channel] = new float[8192 * 3];
  }
  output_ = new float *;
}

RubberBandProcessor::~RubberBandProcessor() {
  delete stretcher_;
  delete scratch_;
  delete output_;
}

size_t RubberBandProcessor::setBuffer(uintptr_t input_ptr, size_t input_size) {
  input_size_ = input_size;
  output_size_ = input_size_ * stretcher_->getTimeRatio(); // NOLINT(cppcoreguidelines-narrowing-conversions)
  input_processed_counter_ = 0;
  output_fetched_counter_ = 0;

  auto channel_count = stretcher_->getChannelCount();

  input_ = reinterpret_cast<float **>(input_ptr);
  for (int channel = 0; channel < channel_count; ++channel) {
    output_[channel] = new float[output_size_];
  }

  stretcher_->study(input_, input_size_, true);

  // Simple first: Process and store ALL
  auto sample_required = stretcher_->getSamplesRequired();
  while (sample_required > 0) {
    auto input = new const float *;
    for (size_t channel = 0; channel < channel_count; ++channel) {
      input[channel] = input_[channel] + input_processed_counter_;
    }
    stretcher_->process(input, sample_required, input_processed_counter_ + sample_required >= input_size_);
    input_processed_counter_ += sample_required; // NOLINT(cppcoreguidelines-narrowing-conversions)
    tryFetch();
    sample_required = stretcher_->getSamplesRequired();
  }

  while (output_fetched_counter_ < output_size_) {
    tryFetch();
  }

  return output_size_;
}

size_t RubberBandProcessor::getOutputSize() const {
  return output_size_;
}

size_t RubberBandProcessor::retrieve(uintptr_t output_ptr, size_t desired_output_size) {
  auto output = reinterpret_cast<float **>(output_ptr); // = new float*[channel_count];
  auto channel_count = stretcher_->getChannelCount();
  const auto output_size = std::min(desired_output_size, output_size_);

  for (int channel = 0; channel < channel_count; ++channel) {
    for (int sample = 0; sample < output_size; sample++) {
      output[channel][sample] = output_[channel][sample];
    }
  }

  return output_size;
}

void RubberBandProcessor::tryFetch() {
  auto channel_count = stretcher_->getChannelCount();
  auto available = stretcher_->available();
  while (available > 0) {
    size_t actual = stretcher_->retrieve(scratch_, available);
    for (size_t channel = 0; channel < channel_count; ++channel) {
      for (size_t sample; sample < actual; ++sample) {
        output_[channel][sample] = scratch_[channel][sample];
      }
    }
    output_fetched_counter_ += actual;
    available = stretcher_->available();
  }
}