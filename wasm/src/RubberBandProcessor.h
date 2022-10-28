//
// Created by Tobias Hegemann on 27.10.22.
//

#ifndef RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H
#define RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H

#include <RubberBandStretcher.h>

class RubberBandProcessor {
 public:
  RubberBandProcessor(size_t sample_rate,
                      size_t channels,
                      double time_ratio = 1.0,
                      double pitch_scale = 1.0);

  ~RubberBandProcessor();

  [[nodiscard]] size_t get_output_size(size_t count_samples) const;

  size_t process(uintptr_t input_ptr, size_t input_size, uintptr_t output_ptr,  bool extract_input = false);

 private:
  int tryFetch(float **output, int output_write_counter);
  static void slice(const float *const *input, const float **output, size_t num_channels, size_t start);
  static void extract(const float *const *input, float **output, size_t num_channels, size_t start, size_t end);

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H
