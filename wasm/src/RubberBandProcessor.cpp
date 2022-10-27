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
void RubberBandProcessor::process(uintptr_t input_ptr, size_t sample_size) {
  auto channel_count = stretcher_->getChannelCount();
  auto input_arr = reinterpret_cast<float **>(input_ptr); // NOLINT(performance-no-int-to-ptr)

  stretcher_->reset();

  const auto block_size = stretcher_->getSamplesRequired();
  for (size_t i = 0; i < sample_size; i += block_size) {
    auto current_arr = input_arr + channel_count * i;
    auto len = std::min(sample_size - i, block_size);
    auto finish = i + block_size > sample_size;
    stretcher_->study(current_arr, len, finish);
  }
  std::cout << "Sample size is " << sample_size << std::endl;
  for (size_t i = 0; i < sample_size; i += block_size) {
    auto current_arr = input_arr + channel_count * i;
    std::cout << "Processing arr = input_arr + " << channel_count << "*" << block_size << "*" << i << std::endl;
    // 0 + 2 * 4096
    auto len = std::min(sample_size - i, block_size);
    auto finish = i + block_size > sample_size;
    stretcher_->process(current_arr, len, finish);
    if(finish) {
      std::cout << "REACHED END AT " << i << "/" << sample_size << " and will read " << len << " till " << (i + len) <<  std::endl;
    }
  }

  /*stretcher_->setMaxProcessSize(sample_size);
  stretcher_->study(input_arr, sample_size, true);
  stretcher_->process(input_arr, sample_size, true);*/

  //delete[] input_arr;
}

size_t RubberBandProcessor::fetch(uintptr_t output_ptr) {
  auto available = stretcher_->available();
  if (available > 0) {
    auto output = reinterpret_cast<float *const *>(output_ptr); // NOLINT(performance-no-int-to-ptr)
    size_t actual = stretcher_->retrieve(output, available);
    return actual;
  }
  return available;
}

size_t RubberBandProcessor::samples_available() const {
  return stretcher_->available();
}
