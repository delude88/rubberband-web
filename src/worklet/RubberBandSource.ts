import { PitchShiftSource } from './PitchShiftSource'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'
import { HeapFloat32Array } from './HeapFloat32Array'
import { HeapAudioBuffer } from './HeapAudioBuffer'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private readonly frameSize: number
  private pitchScale: number = 1
  private timeRatio: number = 1
  private kernel?: RubberBandAPI
  private buffer?: Float32Array[]
  private result?: Float32Array[]
  private inputArray?: HeapAudioBuffer
  private outputArray?: HeapAudioBuffer
  private processCounter: number = 0
  private outputWriteCounter: number = 0
  private outputReadCounter: number = 0

  constructor(module: RubberBandModule, frameSize: number = RENDER_QUANTUM_FRAMES) {
    this.module = module
    this.frameSize = frameSize
  }

  private fetch() {
    console.time("fetch")
    if (this.kernel && this.outputArray && this.buffer && this.result) {
      const channelCount = this.buffer.length
      let available = this.kernel.available()
      while (available > 0) {
        const actual = this.kernel.retrieve(this.outputArray.ptr, available)
        for (let c = 0; c < channelCount; ++c) {
          this.result[c].set(this.outputArray.readChannel(c))
        }
        this.outputWriteCounter += actual
        this.fetch()
        available = this.kernel.getSamplesRequired()
      }
    }
    console.timeEnd("fetch")
  }

  private process() {
    console.time("process")
    if (this.kernel && this.inputArray && this.buffer && this.buffer.length > 0) {
      const sampleSize = this.buffer[0].length
      let samples = this.kernel.getSamplesRequired()
      while (samples > 0) {
        this.kernel.process(this.inputArray.getOffsetPtr(this.processCounter), samples, this.processCounter + samples > sampleSize)
        this.processCounter += samples
        this.fetch()
        samples = this.kernel.getSamplesRequired()
      }
    }
    this.fetch()
    console.timeEnd("process")
  }

  private prepare(): void {
    if (this.buffer && this.buffer.length > 0) {
      this.inputArray?.close()
      this.outputArray?.close()

      const channelCount = this.buffer.length
      const sampleSize = this.buffer[0].length
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)

      this.inputArray = new HeapAudioBuffer(this.module, sampleSize, channelCount)
      this.outputArray = new HeapAudioBuffer(this.module, 8064, channelCount)

      for (let c = 0; c < channelCount; ++c) {
        this.inputArray.writeChannel(c, this.buffer[c])
      }

      console.log('Studying')
      this.kernel.study(this.inputArray.ptr, this.inputArray.size, true)
      console.log(`Studied ${channelCount} channels with ${this.inputArray.size} samples each`)

      this.process();
    }
  }

  pull(channels: Float32Array[]): void {

  }

  setBuffer(buffer: Float32Array[]): void {
    this.buffer = buffer
    this.prepare()
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[PitchShiftMockup] Set pitch scale to ${pitchScale}`)
    this.pitchScale = pitchScale
    this.prepare()
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[PitchShiftMockup] Set time ratio to ${timeRatio}`)
    this.timeRatio = timeRatio
    this.prepare()
  }

  reset(): void {
    console.log(`[PitchShiftMockup] Reset`)
    this.prepare()
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

export default RubberBandSource