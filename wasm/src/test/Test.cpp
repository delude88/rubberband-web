//
// Created by Tobias Hegemann on 04.11.22.
//

#include "Test.h"
#include <iostream>
#include <iomanip>
#include <cmath>

Test::Test(float factor) : factor_(factor), epsilon_(0.0000001f) {
}

Test::~Test() = default;

bool Test::push(uintptr_t ptr, size_t length) {
  auto arr = (const float *const) ptr;
  for (size_t i = 0; i < length; i++) {
    auto value = (((float) i / (float) length) * factor_) - (factor_ / 2.0f);
    if (arr[i] != arr[i]) {
      std::cerr << "arr[" << i << "] is NaN" << std::endl;
      return false;
    }
    if (!compare(arr[i], value)) {
      std::cerr << std::fixed << std::setprecision(20) << "arr[" << i << "] !== " << value << " but is " << arr[i]
                << std::endl;
      return false;
    }
  }
  return true;
}

void Test::pull(uintptr_t ptr, size_t length) {
  auto arr = (float *) ptr;
  for (size_t i = 0; i < length; i++) {
    auto value = (((float) i / (float) length) * factor_) - (factor_ / 2.0f);
    arr[i] = value;
  }
  std::cout << "Filled " << length << " entries, first arr[0]=" << arr[0] << " and last arr[" << (length - 1) << "]="
            << arr[length - 1] << std::endl;
}

float Test::getFactor() const {
  return factor_;
}

void Test::setFactor(float factor) {
  factor_ = factor;
}

bool Test::compare(float a, float b) const {
  return std::fabs(a - b) < epsilon_;
}

void Test::setEpsilon(int epsilon) {
  epsilon_ = epsilon;
}
int Test::getEpsilon() const {
  return epsilon_;
}
