//
// Created by Tobias Hegemann on 04.11.22.
//

#ifndef WASM_SRC_TEST_TEST_H_
#define WASM_SRC_TEST_TEST_H_

#include <cstdint>
#include <cstdlib>

class Test {
 public:
  explicit Test(float factor = 2.0f);
  ~Test();

  void setFactor(float factor);

  [[nodiscard]] float getFactor() const;

  void setEpsilon(int epsilon);

  [[nodiscard]] int getEpsilon() const;

  bool push(uintptr_t ptr, size_t length);

  void pull(uintptr_t ptr, size_t length);

  [[nodiscard]] bool compare(float a, float b) const;
 private:
  float epsilon_;
  float factor_;
};

#endif //WASM_SRC_TEST_TEST_H_
