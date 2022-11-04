//
// Created by Tobias Hegemann on 04.11.22.
//

#include "Test.h"
#include <iostream>

Test::Test(float factor) : factor_(factor) {
}

Test::~Test() = default;

bool Test::push(void *ptr, size_t length) {
  auto arr = (const float *const) ptr;
  for (size_t i = 0; i < length; i++) {
    auto value = (((float) i / (float) length) * factor_) - (factor_ / 2.0f);
    if (arr[i] != value) {
      std::cout << "arr[" << i << "] !== " << value << std::endl;
      return false;
    }
  }
  return false;
}

void Test::pull(void *ptr, size_t length) {
  auto arr = (float *) ptr;
  for (size_t i = 0; i < length; i++) {
    auto value = (((float) i / (float) length) * factor_) - (factor_ / 2.0f);
    arr[i] = value;
  }
}
