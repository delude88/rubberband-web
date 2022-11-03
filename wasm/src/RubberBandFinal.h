//
// Created by Tobias Hegemann on 03.11.22.
//

#ifndef WASM_SRC_RUBBERBANDFINAL_H_
#define WASM_SRC_RUBBERBANDFINAL_H_

#include <RubberBandStretcher.h>

class RubberBandFinal {
 public:
  RubberBandFinal(size_t sample_rate,
                  size_t channel_count,
                  double time_ratio,
                  double pitch_scale);
  ~RubberBandFinal();

  size_t process(uintptr_t input_ptr, size_t input_size);

  void pull(uintptr_t output_ptr, size_t output_size);

 private:
  void processRequiredSamples();

  const float *const * input_;
  size_t input_size_ = 0;
  size_t input_counter_ = 0;

  float** output_buffer_;
  float** output_;
  size_t output_size_ = 0;
  size_t output_counter_ = 0;

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //WASM_SRC_RUBBERBANDFINAL_H_
