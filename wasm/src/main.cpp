//
// Created by Tobias Hegemann on 27.10.22.
//

#include <iostream>
#include "RubberBandProcessor.h"

int main(int argc, char **argv) {
  const auto sample_rate = 44100;
  const auto num_samples = 80000;
  const auto channel_count = 2;

  // Create demo array
  auto channels = new float *[channel_count];
  for (size_t channel = 0; channel < channel_count; ++channel) {
    channels[channel] = new float[num_samples];
  }
  auto channels_ptr = reinterpret_cast<uintptr_t>(channels);

  auto processor = new RubberBandProcessor(
      sample_rate,
      channel_count,
      2,
      1
  );
  std::cout << "Processing now " << num_samples << " samples" << std::endl;
  processor->process(channels_ptr, num_samples);

  std::cout << "Result has " << processor->samples_available() << " samples" << std::endl;

  std::cout << "Hey" << std::endl;
}
