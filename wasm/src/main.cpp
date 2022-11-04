//
// Created by Tobias Hegemann on 27.10.22.
//

#include <iostream>
#include <chrono>
#include <thread>
#include "rubberband/RubberBandProcessor.h"
#include "rubberband/RubberBandAPI.h"
#include "rubberband/RubberBandFinal.h"
#include "test/Test.h"

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
      0.4,
      1
  );
  std::cout << "setBuffer" << std::endl;
  processor->setBuffer((uintptr_t) input, input_size);

  auto output_size = processor->getOutputSize();
  auto output = createOutputArray(channel_count, output_size);

  std::cout << "retrieve" << std::endl;
  processor->retrieve(reinterpret_cast<uintptr_t>(output), output_size);
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
  const auto sample_count = 800000;
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

  const auto frame_size = 128;
  auto output = createOutputArray(channel_count, frame_size);

  // Now use the RubberBandSource
  std::cout << "RubberBandFinal" << std::endl;
  auto rubber_band_final = new RubberBandFinal(kSampleRate, channel_count, sample_count, 1, 1);

  std::cout << "RubberBandFinal > push" << std::endl;
  std::chrono::steady_clock::time_point start = std::chrono::steady_clock::now();
  auto some_buffer = new float *[channel_count];
  for (size_t f = 0; f < sample_count; f += frame_size) {
    for (size_t c = 0; c < channel_count; c++) {
      some_buffer[c] = source[c] + f;
    }
    rubber_band_final->push(reinterpret_cast<uintptr_t>(some_buffer), frame_size);
  }
  std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
  std::cout << "RubberBandFinal > push required " << duration << "ms" << std::endl;

  std::cout << "RubberBandFinal > pull" << std::endl;
  for (size_t f = 0; f < sample_count; f += frame_size) {
    rubber_band_final->pull(reinterpret_cast<uintptr_t>(some_buffer), frame_size);
  }

  delete rubber_band_final;

  // Now use the RubberBandAPI
  std::cout << "RubberBandAPI" << std::endl;
  auto rubber_band_api = new RubberBandAPI(kSampleRate, channel_count, 1, 1, frame_size);

  std::cout << "RubberBandAPI > study" << std::endl;
  auto study_buffer = new float *[channel_count];
  for (size_t f = 0; f < sample_count; f += frame_size) {
    for (size_t c = 0; c < channel_count; c++) {
      study_buffer[c] = source[c] + f;
    }
    rubber_band_api->study(reinterpret_cast<uintptr_t>(study_buffer), frame_size, f + frame_size >= sample_count);
  }

  for (size_t f = 0; f < sample_count; f += frame_size) {
    for (size_t c = 0; c < channel_count; c++) {
      study_buffer[c] = source[c] + f;
    }
    rubber_band_api->study(reinterpret_cast<uintptr_t>(study_buffer), frame_size, f + frame_size >= sample_count);
  }

  delete rubber_band_api;

  delete[] output;
  delete[] source;

  // Test
  auto test = new Test(2);

  if(test->compare(0.1249984, 0.1249985)) {
    std::cerr << "OJ NOOOOO" << std::endl;
  }

  if(!test->compare(0.12499833106994628906, 0.12499836087226867676f)) {
    std::cerr << "OJ NO" << std::endl;
  }

  const auto test_size = 94337023;
  auto arr = new float *[test_size];
  test->pull(reinterpret_cast<uintptr_t>(arr), test_size);
  if(!test->push(reinterpret_cast<uintptr_t>(arr), test_size)) {
    std::cerr << "Test failed" << std::endl;
  } else {
    std::cout << "Test succeeded!" << std::endl;
  }
  delete[] arr;
  delete test;

  // Small experiment
  auto array = new float *[2];
  for (size_t c = 0; c < 2; c++) {
    array[c] = new float[6];
    for (size_t i = 0; i < 6; i++) {
      array[c][i] = 6 - i + (c * 6);
    }
    // Now channel 1 is 6 - 1 and channel 2 is 12 - 6
  }
  // Question: is retrieve() filtering
  auto extract = [](const float *const *array, size_t size) {
    for (size_t c = 0; c < 2; c++) {
      for (size_t i = 0; i < size; i++) {
        std::cout << array[c][i] << ",";
      }
    }
    std::cout << std::endl;
  };
  std::cout << "extract(array, 2): ";
  extract(array, 2);

  auto subArray = new const float *;
  for (size_t c = 0; c < 2; c++) {
    subArray[c] = array[c] + 2;
  }
  std::cout << "extract(subArray (+2), 2): ";
  extract(subArray, 2);

  std::cout << "extract(subArray (+2), 3): ";
  extract(subArray, 3);

  for (size_t c = 0; c < 2; c++) {
    subArray[c] = array[c] + 4;
  }
  std::cout << "extract(subArray (+4), 2): ";
  extract(subArray, 2);

  std::cout << "extract(array, 6): ";
  extract(array, 6);

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