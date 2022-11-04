//
// Created by Tobias Hegemann on 27.10.22.
//

#ifndef RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H
#define RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H

#include <RubberBandStretcher.h>
#include "../../lib/third-party/rubberband-3.0.0/src/common/RingBuffer.h"
#include <queue>

class RubberBandProcessor {
 public:
  RubberBandProcessor(size_t sample_rate,
                      size_t channel_count,
                      double time_ratio = 1.0,
                      double pitch_scale = 1.0);

  ~RubberBandProcessor();

  size_t setBuffer(uintptr_t input_ptr, size_t input_size);

  [[nodiscard]] size_t getOutputSize() const;

  size_t retrieve(uintptr_t output_ptr, size_t output_size);

 private:
  void tryFetch();

  float **input_;
  size_t input_size_ = 0;
  size_t input_processed_counter_ = 0;
  float **output_;
  size_t output_size_ = 0;
  size_t output_fetched_counter_ = 0;

  float** scratch_;

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H
