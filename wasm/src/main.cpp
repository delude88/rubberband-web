//
// Created by Tobias Hegemann on 27.10.22.
//

#include <iostream>
#include "RubberBandProcessor.h"
#include <chrono>
const static auto kSampleRate = 44100;

void runTest(const float *const *source, const size_t channel_count, const size_t sample_count, bool extract) {

  auto source_ptr = reinterpret_cast<uintptr_t>(source);

  auto processor = new RubberBandProcessor(
      kSampleRate,
      channel_count,
      2,
      1
  );
  auto result_sample_count = processor->process(source_ptr, sample_count, extract);

  //auto result_ref = processor->get_processed_samples_by_reference();
  auto result = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    result[channel] = new float[result_sample_count];
  }
  processor->get_processed_samples(result);

  // Show last 5 samples of source and result
  for (size_t channel = 0; channel < channel_count; ++channel) {
    for (size_t sample = sample_count - 5; sample < sample_count; ++sample) {
      std::cout << "source[channel = " << channel << "][sample = " << sample << "] = " << source[channel][sample]
                << std::endl;
    }
  }
  std::cout << "Compare" << std::endl;
  for (size_t channel = 0; channel < channel_count; ++channel) {
    for (size_t sample = result_sample_count - 5; sample < result_sample_count; sample++) {
      std::cout << "result[channel = " << channel << "][sample = " << sample << "] = " << result[channel][sample]
                << std::endl;
      //assert(result[channel][sample] == result_ref[channel][sample]);
    }
  }
  std::cout << "Deleting processor" << std::endl;
  delete processor;
  // Now this would fail
  // std::cout << "Failing: " << result_ref[0][0] << std::endl;
  // But you can still
  // std::cout << "Not failing: " << result[0][0] << std::endl;
  delete[] result;
}

int main(int argc, char **argv) {
  const auto sample_count = 800000;
  const auto channel_count = 2;

  // Create demo array
  auto unsave_source = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    unsave_source[channel] = new float[sample_count];
    for (size_t sample = 0; sample < sample_count; ++sample) {
      unsave_source[channel][sample] = sample + (1000 * channel); // NOLINT(cppcoreguidelines-narrowing-conversions)
    }
  }
  const auto source = reinterpret_cast<const float *const *>(unsave_source);

  std::cout << "Running test with shared arrays" << std::endl;
  std::chrono::steady_clock::time_point begin1 = std::chrono::steady_clock::now();
  runTest(source, channel_count, sample_count, false);
  std::chrono::steady_clock::time_point end1 = std::chrono::steady_clock::now();

  std::cout << "Running test with copying arrays" << std::endl;
  std::chrono::steady_clock::time_point begin2 = std::chrono::steady_clock::now();
  runTest(source, channel_count, sample_count, true);
  std::chrono::steady_clock::time_point end2 = std::chrono::steady_clock::now();

  auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - begin1).count();
  auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - begin2).count();
  auto sample_length_in_seconds = sample_count / kSampleRate;
  std::cout << "Duration WITHOUT extracting track of " << sample_length_in_seconds << "s: " << duration1 << "ms"
            << std::endl;
  std::cout << "Duration WITH extracting track of " << sample_length_in_seconds << "s: " << duration2 << "ms" << std::endl;

  delete[] source;

  return 0;
}



/*
void slice(float** input, float** output, size_t num_channels, size_t start) {
  for (size_t channel = 0; channel < num_channels; ++channel) {
    output[channel] = input[channel] + start;
  }
}

void test(float** channels, size_t num_channels, size_t num_samples) {
  // Understand how to slice array
  // we want now an array if size channel_count
  auto output = new float *[num_channels];
  const auto position = num_samples / num_channels / 2;
  std::cout << "First position should be " << channels[0][position] << std::endl;
  std::cout << "Second position should be " << channels[1][position] << std::endl;
  slice(channels, output, num_channels, position);

  // Make tests
  assert(channels[0][0] != output[0][0]);
  assert(channels[1][0] != output[1][0]);
  assert(channels[0][position] == output[0][0]);
  assert(channels[1][position] == output[1][0]);

  // Print also
  const auto len = 10;
  for (size_t channel = 0; channel < num_channels; ++channel) {
    for (size_t i = 0; i < len; ++i) {
      std::cout << "portion[" << channel << "][" << i << "]: " << output[channel][i] << std::endl;
    }
  }

  delete[] output;
}*/