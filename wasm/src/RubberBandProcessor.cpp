//
// Created by Tobias Hegemann on 27.10.22.
//

#include "RubberBandProcessor.h"
#include <iostream>

const RubberBand::RubberBandStretcher::Options kOption =
    RubberBand::RubberBandStretcher::OptionProcessOffline | RubberBand::RubberBandStretcher::OptionEngineFiner;

RubberBandProcessor::RubberBandProcessor(size_t sample_rate,
                                         size_t channels,
                                         double time_ratio,
                                         double pitch_scale) {
  stretcher_ = new RubberBand::RubberBandStretcher(
      sample_rate,
      channels,
      kOption,
      time_ratio,
      pitch_scale
  );
}

RubberBandProcessor::~RubberBandProcessor() {
  delete stretcher_;
}

size_t RubberBandProcessor::process( uintptr_t input_ptr,
                                    size_t input_size,
                                     uintptr_t output_ptr,
                                    bool extract) {
  auto channel_count = stretcher_->getChannelCount();
  auto input_arr = reinterpret_cast<const float *const *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
  auto output_arr = reinterpret_cast<float **>(input_ptr);

  stretcher_->reset();

  auto output_size = get_output_size(input_size);

  const auto block_size = stretcher_->getSamplesRequired();

  auto sub_array = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; channel++) {
    sub_array[channel] = new float[input_size];
  }
  auto sub_array_ptr = new const float *;

  // Study
  for (size_t i = 0; i < input_size; i += block_size) {
    auto len = std::min(input_size - i, block_size);
    auto finish = i + block_size > input_size;
    if (extract) {
      RubberBandProcessor::extract(input_arr, sub_array, channel_count, i, i + len);
      stretcher_->study(sub_array, len, finish);
    } else {
      slice(input_arr, sub_array_ptr, channel_count, i);
      stretcher_->study(sub_array_ptr, len, finish);
    }
  }

  // And process
  int output_write_counter = 0;
  for (size_t i = 0; i < input_size; i += block_size) {
    // Extract slice
    auto len = std::min(input_size - i, block_size);
    auto finish = i + block_size > input_size;
    if (extract) {
      RubberBandProcessor::extract(input_arr, sub_array, channel_count, i, i + len);
      stretcher_->process(sub_array, len, finish);
    } else {
      slice(input_arr, sub_array_ptr, channel_count, i);
      stretcher_->process(sub_array_ptr, len, finish);
    }
    // Retrieve
    output_write_counter = tryFetch(output_write_counter);
  }
  do {
    output_write_counter = tryFetch(output_write_counter);
  } while (output_write_counter < output_size);
  delete[] sub_array;
  delete sub_array_ptr;

  return output_size;
}

int RubberBandProcessor::tryFetch(float **output, int output_write_counter) {
  // Fetch as much as possible
  const auto channel_count = stretcher_->getChannelCount();
  int available;
  while ((available = stretcher_->available()) > 0) {
    auto buffer = new float *[channel_count];
    for (size_t channel = 0; channel < channel_count; channel++) {
      buffer[channel] = new float[available];
    }
    // Let stretcher write to buffer
    stretcher_->retrieve(buffer, available);
    // Append buffer to output by copying
    for (size_t channel = 0; channel < channel_count; channel++) {
      // Fetch and write samples
      for (size_t i = 0; i < available; i++) {
        output[channel][output_write_counter + i] = buffer[channel][i];
      }
    }
    delete[] buffer;
    output_write_counter += available;
  }
  return output_write_counter;
}

/*
Duration WITHOUT extracting track of 18s: 1839ms
Duration WITH extracting track of 18s: 1726ms
 */
[[maybe_unused]] size_t RubberBandProcessor::get_processed_samples(float **output) {
  if (processed_samples_ && processed_sample_count_ > 0) {
    const auto channel_count = stretcher_->getChannelCount();
    for (size_t channel = 0; channel < channel_count; ++channel) {
      for (size_t sample = 0; sample < processed_sample_count_; ++sample) {
        output[channel][sample] = processed_samples_[channel][sample];
      }
      memcpy(&output[channel][0], &processed_samples_[channel][0], processed_sample_count_ * channel_count);
    }
    //memcpy(&output[0][0], &processed_samples_[0][0], processed_sample_count_ * channel_count * sizeof(float));
  }
  return processed_sample_count_;
}

void RubberBandProcessor::slice(const float *const *input, const float **output, size_t num_channels, size_t start) {
  for (size_t channel = 0; channel < num_channels; ++channel) {
    output[channel] = input[channel] + start;
  }
}
void RubberBandProcessor::extract(const float *const *input,
                                  float **output,
                                  size_t num_channels,
                                  size_t start,
                                  size_t end) {
  auto length = end - start;
  for (size_t channel = 0; channel < num_channels; ++channel) {
    for (size_t sample = 0; sample < length; ++sample) {
      output[channel][sample] = input[channel][start + sample];
    }
  }
}
size_t RubberBandProcessor::get_processed_sample_count() const {
  return processed_sample_count_;
}
size_t RubberBandProcessor::calculate_output_sample_count(size_t num_samples) const {
  return stretcher_->getTimeRatio() * num_samples; // NOLINT(cppcoreguidelines-narrowing-conversions)
}
