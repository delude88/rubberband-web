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
                  size_t sample_count,
                  double time_ratio,
                  double pitch_scale);
  ~RubberBandFinal();

  void push(uintptr_t input_ptr, size_t input_size);

  bool pull(uintptr_t output_ptr, size_t output_size);

 private:
  void fetch();

  size_t input_size_;
  size_t input_write_pos_ = 0;
  size_t input_process_pos_ = 0;
  float **input_buffer_;

  float **input_;
  float **output_;
  size_t output_write_pos_ = 0;
  size_t output_read_pos_ = 0;
  float **output_buffer_;
  size_t output_size_;

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //WASM_SRC_RUBBERBANDFINAL_H_
