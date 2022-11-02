//
// Created by Tobias Hegemann on 31.10.22.
//

#ifndef WASM_SRC_RUBBERBANDSOURCE_H_
#define WASM_SRC_RUBBERBANDSOURCE_H_

#include <RubberBandStretcher.h>

class RubberBandSource {
 public:
  explicit RubberBandSource(size_t sample_rate, size_t channel_count, size_t pre_process_size = kRenderQuantumFrames * 8);
  ~RubberBandSource();

  void setTimeRatio(double time_ratio);

  void setPitchScale(double pitch_scale);

  void setBuffer(uintptr_t input_ptr, size_t input_size);

  size_t retrieve(uintptr_t output_ptr);

  [[nodiscard]] size_t getInputSize() const;

  [[nodiscard]] size_t getOutputSize() const;

  int getSamplesAvailable();

  void reset();
 private:
  void restart();
  void process(size_t sample_size);

  const float *const *input_;
  size_t input_size_;
  size_t output_size_;
  size_t play_position_;
  size_t pre_process_position_;
  size_t pre_process_size_;
  float** process_buffer_;
  RubberBand::RubberBandStretcher *stretcher_;

  static const size_t kRenderQuantumFrames = 128;
};

#endif //WASM_SRC_RUBBERBANDSOURCE_H_
