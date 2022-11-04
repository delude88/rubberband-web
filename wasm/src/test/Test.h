//
// Created by Tobias Hegemann on 04.11.22.
//

#ifndef WASM_SRC_TEST_TEST_H_
#define WASM_SRC_TEST_TEST_H_

#include <cstdlib>

class Test {
 public:
  explicit Test(float factor = 2.0f);
  ~Test();

  bool push(void* ptr, size_t length);

  void pull(void* ptr, size_t length);

 private:
  float factor_;
};

#endif //WASM_SRC_TEST_TEST_H_
