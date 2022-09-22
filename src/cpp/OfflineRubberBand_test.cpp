//
// Created by Tobias Hegemann on 22.09.22.
//
#include <gtest/gtest.h>
#include "OfflineRubberBand.h"

TEST(RubberbandAPI, OfflineRubberband) {
  // Test constructor parameters
  EXPECT_NO_THROW({
                    new OfflineRubberBand(48000, 2);
                  });
  EXPECT_NO_THROW({
                    new OfflineRubberBand(44100, 1);
                  });
  EXPECT_NO_THROW({
                    new OfflineRubberBand(192000, 64);
                  });
  EXPECT_ANY_THROW({
                     new OfflineRubberBand(0, 2);
                   });
  EXPECT_ANY_THROW({
                     new OfflineRubberBand(44100, 0);
                   });

  auto *rubber_band = new OfflineRubberBand(44100, 1);
  EXPECT_NO_THROW({
                    rubber_band->setTempo(0.1);
                    rubber_band->setTempo(1.1);
                    rubber_band->setTempo(5.0);
                  });
  EXPECT_ANY_THROW({
                     rubber_band->setTempo(0);
                   });
  EXPECT_ANY_THROW({
                     rubber_band->setTempo(-1);
                   });
}
