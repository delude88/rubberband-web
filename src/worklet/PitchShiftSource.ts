
export interface PitchShiftSource {
  setTimeRatio(timeRatio: number): void

  setPitchScale(pitchScale: number): void

  setBuffer(buffer: Float32Array[]): void

  reset(): void

  pull(channels: Float32Array[]): void

  close(): void
}