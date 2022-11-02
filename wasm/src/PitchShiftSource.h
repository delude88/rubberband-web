//
// Created by Tobias Hegemann on 02.11.22.
//

#ifndef WASM_SRC_PITCHSHIFTSOURCE_H_
#define WASM_SRC_PITCHSHIFTSOURCE_H_

#include <cstdint>
#include <cstddef>

class PitchShiftSource {
 public:
  virtual ~PitchShiftSource() = default;
  virtual void setBuffer(uintptr_t input_ptr, size_t input_size) = 0;
  virtual void setTimeRatio(double time_ratio) = 0;
  virtual void setPitchScale(double pitch_scale) = 0;
  virtual size_t retrieve(uintptr_t output_ptr) = 0;
  [[nodiscard]] virtual size_t getInputSize() const = 0;
  [[nodiscard]] virtual size_t getOutputSize() const = 0;
  virtual size_t getSamplesAvailable() = 0;
  virtual void reset() = 0;
};

#endif //WASM_SRC_PITCHSHIFTSOURCE_H_
