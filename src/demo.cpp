#include <iostream>
#include "cpp/RealtimeRubberband.h"

int main() {
  std::cout << "Playground" << std::endl;
  auto *pitchshifter = new RealtimeRubberband(44100, 2);
  std::cout << pitchshifter->getVersion() << std::endl;
  std::cout << pitchshifter->getSamplesRequired() << std::endl;
  pitchshifter->setPitch(0.5);
  pitchshifter->setTempo(0.5);
  std::cout << pitchshifter->getSamplesRequired() << std::endl;
}
