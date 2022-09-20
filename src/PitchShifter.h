//
// Created by Tobias Hegemann on 20.09.22.
//

#ifndef RUBBERBAND_WEB_SRC_PITCHSHIFTER_H_
#define RUBBERBAND_WEB_SRC_PITCHSHIFTER_H_

#include <RubberBandStretcher.h>
#include "../lib/rubberband/src/common/RingBuffer.h"

class PitchShifter {
 public:
  PitchShifter(size_t sampleRate, size_t channels);

  int getVersion();

  void setTempo(double tempo);

  void setPitch(double tempo);

  size_t getSamplesRequired();

 private:
  RubberBand::RubberBandStretcher *stretcher_;
  RubberBand::RingBuffer<float> **output_buffer_;
  RubberBand::RingBuffer<float> **delay_buffer_;
};

#endif //RUBBERBAND_WEB_SRC_PITCHSHIFTER_H_
