#!/bin/bash
# Install required dependencies

# Make sure we have a 'third-party' folder.
mkdir -p third-party

# Download and extract rubberband
export RUBBERBAND_VERSION="3.0.0"
if [ ! -d "third-party/rubberband-3.0.0" ]; then
  echo "(0/4) Preparing build by fetching rubberband"
  curl https://breakfastquay.com/files/releases/rubberband-${RUBBERBAND_VERSION}.tar.bz2 | tar -xj -C third-party
fi