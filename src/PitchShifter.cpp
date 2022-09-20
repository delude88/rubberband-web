//
// Created by Tobias Hegemann on 20.09.22.
//

#include "PitchShifter.h"

#include <algorithm>

PitchShifter::PitchShifter(size_t sampleRate, size_t channels) :
    channels(channels),
    stretcher(new RubberBand::RubberBandStretcher
                  (sampleRate, channels,
                   RubberBand::RubberBandStretcher::OptionProcessRealTime |
                       RubberBand::RubberBandStretcher::OptionPitchHighConsistency)
    ) {
  delay_buffer = new RubberBand::RingBuffer<float> *[channels];
  output_buffer = new RubberBand::RingBuffer<float> *[channels];
  auto buffer_size = kBlockSize + kReserve + 8192;
  for (size_t channel = 0; channel < channels; ++channel) {
    delay_buffer[channel] = new RubberBand::RingBuffer<float>(buffer_size);
    output_buffer[channel] = new RubberBand::RingBuffer<float>(buffer_size);
  }
}

PitchShifter::~PitchShifter() {
  delete[] delay_buffer;
  delete[] output_buffer;
}

int PitchShifter::getVersion() {
  return stretcher->getEngineVersion();
}

void PitchShifter::setTempo(double tempo) {
  stretcher->reset();
  stretcher->setTimeRatio(tempo);
}

void PitchShifter::setPitch(double pitch) {
  stretcher->reset();
  stretcher->setPitchScale(pitch);
}

size_t PitchShifter::getSamplesRequired() {
  return stretcher->getSamplesRequired();
}

size_t PitchShifter::getSamplesAvailable() {
  return output_buffer[0]->getReadSpace();
}

void PitchShifter::push(float *input, size_t length) {
}

void PitchShifter::pull(float **output, size_t length) {
  for (size_t channel = 0; channel < channels; ++channel) {
    size_t available = output_buffer[channel]->getReadSpace();
    output_buffer[channel]->read(
        &(output[channel][0]),
        std::min<size_t>(available, length)
    );
  }
}

void PitchShifter::process() {
  auto available = stretcher->available();
  if (available > 0) {
    // Pass data into output buffer
    if (output_buffer[0]->getWriteSpace() <= available) {
      // (!) BUFFER OVERRUN
      std::cout << "BUFFER OVERRUN" << std::endl;
    }
    size_t actual = stretcher->retrieve(scratch, available);

    for (size_t channel = 0; channel < channels; ++channel) {
      output_buffer[channel]->write(scratch[channel], actual);
    }
  }
}
