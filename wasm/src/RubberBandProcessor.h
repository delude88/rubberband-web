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

  void process(uintptr_t input_ptr, size_t sample_size);

  size_t fetch(uintptr_t output_ptr);

  [[nodiscard]] size_t samples_available() const;
 private:

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //RUBBERBAND_WEB_RUBBERBANDPROCESSOR_H
