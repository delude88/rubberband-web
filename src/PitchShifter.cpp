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
  scratch = new float *[channels];
  auto buffer_size = kBlockSize + kReserve + 8192;
  for (size_t channel = 0; channel < channels; ++channel) {
    delay_buffer[channel] = new RubberBand::RingBuffer<float>(buffer_size);
    output_buffer[channel] = new RubberBand::RingBuffer<float>(buffer_size);
    scratch[channel] = new float[buffer_size];
  }
}

PitchShifter::~PitchShifter() {
  delete[] delay_buffer;
  delete[] output_buffer;
  delete[] scratch;
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

void PitchShifter::push(uintptr_t input_ptr, size_t length) {
  auto *input = reinterpret_cast<float *>(input_ptr);
  auto **input_arr = new float *[channels];
  for (size_t channel = 0; channel < channels; ++channel) {
    float *source = input + channel * length;
    input_arr[channel] = source;
  }
  //std::cout << "pushed " << length << " samples on " << channels << " channels" << std::endl;
  stretcher->process(input_arr, length, false);
  process();
}

void PitchShifter::pull(uintptr_t output_ptr, size_t length) {
  float *output = reinterpret_cast<float *>(output_ptr);
  for (size_t channel = 0; channel < channels; ++channel) {
    size_t available = output_buffer[channel]->getReadSpace();
    float *destination = output + channel * length;
    output_buffer[channel]->read(
        destination,
        std::min<size_t>(available, length)
    );
  }
  //std::cout << "pulled " << length << std::endl;
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
