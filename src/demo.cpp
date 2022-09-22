#include <iostream>
#include "cpp/OfflineRubberBand.h"

int main() {
  std::cout << "Hey, this is a playground" << std::endl;
  auto *pitchshifter = new OfflineRubberBand(0, 2);
  std::cout << pitchshifter->getVersion() << std::endl;
  std::cout << pitchshifter->getSamplesAvailable() << std::endl;
  pitchshifter->setPitch(0.5);
  pitchshifter->setTempo(0.5);
  std::cout << pitchshifter->getSamplesAvailable() << std::endl;
}
