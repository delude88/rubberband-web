//
// Created by Tobias Hegemann on 27.10.22.
//

#include <iostream>
#include "RubberBandProcessor.h"
#include "OfflineRubberBand.h"
#include <chrono>
const static auto kSampleRate = 44100;
const static auto timeRatio = 2;

float **createOutputArray(size_t channel_count, size_t output_size) {
  auto output = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    output[channel] = new float[output_size];
  }
  return output;
}

void runTest(const float *const *input, const size_t channel_count, const size_t input_size, bool extract) {
  auto processor = new RubberBandProcessor(
      kSampleRate,
      channel_count,
      timeRatio,
      1
  );
  auto output_size = processor->get_output_size(input_size);
  auto output = createOutputArray(channel_count, output_size);

  auto input_ptr = reinterpret_cast<uintptr_t>(input);
  auto output_ptr = reinterpret_cast<uintptr_t>(output);
  processor->process(input_ptr, input_size, output_ptr, extract);
  /*
  // Show last 5 samples of source and result
  for (size_t channel = 0; channel < channel_count; ++channel) {
    for (size_t sample = input_size - 5; sample < input_size; ++sample) {
      std::cout << "source[channel = " << channel << "][sample = " << sample << "] = " << input[channel][sample]
                << std::endl;
    }
  }
  std::cout << "Compare" << std::endl;
  for (size_t channel = 0; channel < channel_count; ++channel) {
    for (size_t sample = result_sample_count - 5; sample < result_sample_count; sample++) {
      std::cout << "result[channel = " << channel << "][sample = " << sample << "] = " << output[channel][sample]
                << std::endl;
    }
  }*/
  delete processor;
  delete[] output;
}

int main(int argc, char **argv) {
  const auto sample_count = 80000;
  const auto channel_count = 2;

  // Create demo array
  auto source = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    source[channel] = new float[sample_count];
    for (size_t sample = 0; sample < sample_count; ++sample) {
      source[channel][sample] = sample; // NOLINT(cppcoreguidelines-narrowing-conversions)
    }
  }

  auto num_iterations = 1;
  size_t duration_sum_1 = 0;
  size_t duration_sum_2 = 0;
  for (int i = 0; i < num_iterations; i++) {
    std::cout << "Running " << (i + 1) << ". time with shared arrays ...";
    std::chrono::steady_clock::time_point begin1 = std::chrono::steady_clock::now();
    runTest(source, channel_count, sample_count, false);
    std::chrono::steady_clock::time_point end1 = std::chrono::steady_clock::now();
    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - begin1).count();
    duration_sum_1 += duration1;
    std::cout << " done after " << duration1 << "ms" << std::endl;

    std::cout << "Running " << (i + 1) << ". time with copying arrays ...";
    std::chrono::steady_clock::time_point begin2 = std::chrono::steady_clock::now();
    runTest(source, channel_count, sample_count, true);
    std::chrono::steady_clock::time_point end2 = std::chrono::steady_clock::now();
    auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - begin2).count();
    duration_sum_2 += duration2;
    std::cout << " done after " << duration2 << "ms" << std::endl;
  }
  const auto duration_mean_1 = duration_sum_1 / num_iterations;
  const auto duration_mean_2 = duration_sum_2 / num_iterations;

  auto sample_length_in_seconds = sample_count / kSampleRate;
  std::cout << "Mean duration WITHOUT extracting track of " << sample_length_in_seconds << "s: " << duration_mean_1
            << "ms"
            << std::endl;
  std::cout << "Mean duration WITH extracting track of " << sample_length_in_seconds << "s: " << duration_mean_2 << "ms"
            << std::endl;

  // Now use the OfflineRubberBand
  auto offline_rubber_band = new OfflineRubberBand(kSampleRate, channel_count);
  auto source_ptr = reinterpret_cast<uintptr_t>(source);

  auto output = createOutputArray(channel_count, 1);
  offline_rubber_band->study(source_ptr, sample_count);
  offline_rubber_band->process(source_ptr, sample_count, true);
  std::cout << "Have now " << offline_rubber_band->getSamplesAvailable() << std::endl;
  //offline_rubber_band->retrieve(reinterpret_cast<uintptr_t>(output), sample_count);

  offline_rubber_band->setTempo(1.2);
  //delete[] output;
  output = createOutputArray(channel_count, 1);
  offline_rubber_band->study(source_ptr, sample_count);
  offline_rubber_band->process(source_ptr, sample_count, true);
  //offline_rubber_band->retrieve(reinterpret_cast<uintptr_t>(output), sample_count);

  delete offline_rubber_band;

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