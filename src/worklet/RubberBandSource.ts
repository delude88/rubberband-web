import { PitchShiftSource } from './PitchShiftSource'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'
import { HeapChannelStream, HeapArrayManager } from '../wasm/HeapArrayManager'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private readonly frameSize: number
  private pitchScale: number = 1
  private timeRatio: number = 1
  private kernel?: RubberBandAPI
  private buffer?: Float32Array[]
  private result?: Float32Array[]
  private inputArray?: HeapChannelStream
  private outputArray?: HeapChannelStream
  private processCounter: number = 0
  private outputWriteCounter: number = 0
  private outputReadCounter: number = 0

  constructor(module: RubberBandModule, frameSize: number = RENDER_QUANTUM_FRAMES) {
    this.module = module
    this.frameSize = frameSize
  }

  private fetch() {
    console.time('fetch')
    let counter = 0
    if (this.kernel && this.outputArray && this.buffer && this.result) {
      const channelCount = this.buffer.length
      let available = this.kernel.available()
      while (available > 0) {
        const actual = this.kernel.retrieve(this.outputArray.ptr, available)
        for (let c = 0; c < channelCount; ++c) {
          this.result[c].set(this.outputArray.getChannel(c))
        }
        counter += actual
        this.outputWriteCounter += actual
        this.fetch()
        available = this.kernel.getSamplesRequired()
      }
    }
    console.log(`Fetched ${counter}`)
    console.timeEnd('fetch')
  }

  private process() {
    console.time('process')
    if (this.kernel && this.inputArray && this.buffer && this.buffer.length > 0) {
      const sampleSize = this.buffer[0].length
      let samples = this.kernel.getSamplesRequired()
      while (samples > 0) {
        this.kernel.process(this.inputArray.getPtr(this.processCounter), samples, this.processCounter + samples > sampleSize)
        this.processCounter += samples
        this.fetch()
        samples = this.kernel.getSamplesRequired()
      }
    }
    this.fetch()
    console.timeEnd('process')
  }

  private prepare(): void {
    if (this.buffer && this.buffer.length > 0) {
      const channelCount = this.buffer.length
      const sampleSize = this.buffer[0].length
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)
      const memory = new HeapArrayManager(this.module)

      this.inputArray = new HeapChannelStream(memory, sampleSize, channelCount)
      this.outputArray = new HeapChannelStream(memory, 8164, channelCount)

      for (let c = 0; c < channelCount; ++c) {
        this.inputArray.getChannel(c).set(this.buffer[c])
      }

      console.log('Studying')
      console.log(this.inputArray)
      this.kernel.study(this.inputArray.ptr, this.inputArray.size, true)
      console.log(`Studied ${channelCount} channels with ${this.inputArray.size} samples each`)

      this.process()
    }
  }

  pull(channels: Float32Array[]): void {
    if (channels.length > 0 && this.result && this.outputWriteCounter > this.outputReadCounter) {
      const channelCount = Math.min(channels.length, this.result.length)
      const length = Math.min(channels[0].length, this.outputWriteCounter - this.outputReadCounter)
      console.log(`Feeding ${length}`)
      for (let c = 0; c < channelCount; ++c) {
        channels[c].set(this.result[c].subarray(this.outputReadCounter, this.outputReadCounter + length))
      }
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    // Validate buffer
    if (buffer.length > 0) {
      for (let c = 0; c < buffer.length; ++c) {
        if (buffer[c].byteLength === 0) {
          throw new Error(`[PitchShiftSourceProcessor] setBuffer: buffer[${c}].byteLength === 0`)
        } else {
          console.log(`[PitchShiftSourceProcessor] setBuffer: buffer[${c}].byteLength === ${buffer[c].byteLength}`)
        }
      }
    }
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