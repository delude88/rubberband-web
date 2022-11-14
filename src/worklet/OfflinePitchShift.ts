export interface OfflinePitchShift {
  setTimeRatio(timeRatio: number): void

  setPitchScale(pitchScale: number): void

  setBuffer(buffer: Float32Array[]): void

  pull(channels: Float32Array[]): void

  reset(): void

  close(): void
}