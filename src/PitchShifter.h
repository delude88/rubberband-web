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
  ~PitchShifter();

  int getVersion();

  void setTempo(double tempo);

  void setPitch(double tempo);

  size_t getSamplesRequired();

  size_t getSamplesAvailable();

  //void push(const float *const *input, size_t length);
  void push(float *input, size_t length);

  void pull(float **output, size_t length);

 private:
  void process();

  RubberBand::RubberBandStretcher *stretcher;
  RubberBand::RingBuffer<float> **output_buffer;
  RubberBand::RingBuffer<float> **delay_buffer;

  size_t channels;
  float **scratch;

  const size_t kBlockSize = 1024;
  const size_t kReserve = 8192;
};

#endif //RUBBERBAND_WEB_SRC_PITCHSHIFTER_H_
