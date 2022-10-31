//
// Created by Tobias Hegemann on 27.10.22.
//

#include "RubberBandProcessor.h"
#include <iostream>

const RubberBand::RubberBandStretcher::Options kOption = RubberBand::RubberBandStretcher::OptionProcessOffline
    | RubberBand::RubberBandStretcher::OptionPitchHighConsistency
    | RubberBand::RubberBandStretcher::OptionEngineFiner;

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

size_t RubberBandProcessor::process(uintptr_t input_ptr,
                                    size_t input_size,
                                    uintptr_t output_ptr,
                                    bool extract) {
  auto channel_count = stretcher_->getChannelCount();
  auto input_arr = reinterpret_cast<const float *const *>(input_ptr); // NOLINT(performance-no-int-to-ptr)
  auto output_arr = reinterpret_cast<float **>(output_ptr);

  stretcher_->reset();

  auto output_size = get_output_size(input_size);

  const auto block_size = stretcher_->getSamplesRequired();

  auto sub_array = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; channel++) {
    sub_array[channel] = new float[input_size];
  }
  auto sub_array_ptr = new const float *;

  // Study
  std::cout << "Studying " << input_size << " samples" << std::endl;
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
  std::cout << "Processing " << input_size << " samples " << " with block size of " << block_size << std::endl;
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
    output_write_counter = tryFetch(output_arr, output_write_counter);
  }
  std::cout << "Reading last samples of result" << std::endl;
  do {
    output_write_counter = tryFetch(output_arr, output_write_counter);
  } while (output_write_counter < output_size);

  std::cout << "Cleaning up" << std::endl;
  delete[] sub_array;
  delete sub_array_ptr;

  std::cout << "Returning output size of " << output_size << std::endl;
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

size_t RubberBandProcessor::get_output_size(size_t input_size) const {
  return stretcher_->getTimeRatio() * input_size; // NOLINT(cppcoreguidelines-narrowing-conversions)
}
