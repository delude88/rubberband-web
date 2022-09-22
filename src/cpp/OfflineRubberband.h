//
// Created by Tobias Hegemann on 20.09.22.
//

#ifndef RUBBERBAND_WEB_SRC_OFFLINE_RUBBERBAND_H_
#define RUBBERBAND_WEB_SRC_OFFLINE_RUBBERBAND_H_

#include <RubberBandStretcher.h>
#include "../../lib/rubberband/src/common/RingBuffer.h"

/**

Job: read many
**/

class OfflineRubberband {
 public:
  OfflineRubberband(size_t sampleRate, size_t channel_count, bool high_quality = false);
  ~OfflineRubberband();

  int getVersion();

  void setTempo(double tempo);

  void setPitch(double tempo);

  void setFormantScale(double scale);

  __attribute__((unused)) size_t getSamplesAvailable();

  void push(uintptr_t input_ptr, size_t sample_size);

  int getLatency();

  __attribute__((unused)) void pull(uintptr_t output_ptr, size_t sample_size);

 private:
  void updateRatio();

  void fetchProcessed();

  RubberBand::RubberBandStretcher *stretcher_;
  RubberBand::RingBuffer<float> **output_buffer_;

  size_t latency_;

  size_t start_pad_samples_;

  size_t start_delay_samples_;

  size_t channel_count_;
  float **scratch_;

  const size_t kBlockSize_ = 1024;
  const size_t kReserve_ = 8192;
};

#endif //RUBBERBAND_WEB_SRC_OFFLINE_RUBBERBAND_H_
