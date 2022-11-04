//
// Created by Tobias Hegemann on 02.11.22.
//

#ifndef WASM_SRC_RUBBERBANDAPI_H_
#define WASM_SRC_RUBBERBANDAPI_H_

#include <RubberBandStretcher.h>
#include <queue>

class RubberBandAPI {
 public:
  RubberBandAPI(size_t sample_rate,
                size_t channel_count,
                double time_ratio = 1,
                double pitch_scale = 1,
                size_t sample_size = kSampleSize);
  ~RubberBandAPI();

  void study(uintptr_t input_ptr, size_t input_size, bool final);

  void process(uintptr_t input_ptr, size_t input_size, bool final);

  size_t retrieve(uintptr_t output_ptr, size_t output_size);

  [[nodiscard]] size_t available() const;

  [[nodiscard]] size_t getSamplesRequired() const;

  void setMaxProcessSize(size_t size) const;

 private:
  bool validate(const float *const *input, size_t input_size);

  RubberBand::RubberBandStretcher *stretcher_;

  static const size_t kSampleSize = 128;
};

#endif //WASM_SRC_RUBBERBANDAPI_H_
