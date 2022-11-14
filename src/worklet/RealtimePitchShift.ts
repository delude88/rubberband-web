export interface RealtimePitchShift {
  get channelCount(): number

  get timeRatio(): number;

  set timeRatio(timeRatio: number)

  get pitchScale(): number;

  set pitchScale(pitchScale: number)

  get samplesAvailable(): number

  push(channels: Float32Array[], numSamples?: number): void

  pull(channels: Float32Array[]): Float32Array[]
}