#include <iostream>
#include "PitchShifter.h"

int main() {
  std::cout << "Hello" << std::endl;
  auto *pitchshifter = new PitchShifter(44100, 2);
  std::cout << pitchshifter->getVersion() << std::endl;
  std::cout << pitchshifter->getSamplesRequired() << std::endl;
  pitchshifter->setPitch(0.5);
  pitchshifter->setTempo(0.5);
  std::cout << pitchshifter->getSamplesRequired() << std::endl;
}
