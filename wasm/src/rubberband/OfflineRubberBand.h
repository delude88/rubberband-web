//
// Created by Tobias Hegemann on 31.10.22.
//

#ifndef WASM_SRC_OFFLINERUBBERBAND_H_
#define WASM_SRC_OFFLINERUBBERBAND_H_

#include <RubberBandStretcher.h>

class OfflineRubberBand {
 public:
  explicit OfflineRubberBand(size_t sample_rate, size_t channel_count);
  ~OfflineRubberBand();

  void setTempo(double tempo);

  void setPitch(double pitch);

  void study(uintptr_t input_ptr, size_t sample_size);

  void process(uintptr_t input_ptr, size_t sample_size, bool final);

  void processSlice(uintptr_t input_ptr, size_t position, size_t sample_size, bool final);

  void retrieve(uintptr_t output_ptr, size_t sample_size);

  int getSamplesAvailable();

 private:
  static void slice(const float *const *input, const float **output, size_t num_channels, size_t start);

  RubberBand::RubberBandStretcher *stretcher_;
};

#endif //WASM_SRC_OFFLINERUBBERBAND_H_
