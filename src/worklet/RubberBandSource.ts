import { PitchShiftSource } from './PitchShiftSource'
import HeapArray from './HeapArray'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'

const RENDER_QUANTUM_FRAMES = 128

const PRE_BUFFER_SIZE = RENDER_QUANTUM_FRAMES * 20

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private kernel?: RubberBandAPI
  private pitchScale: number = 1
  private timeRatio: number = 1
  private counter: number = 0
  private endPos: number = 0
  private buffer?: Float32Array[]
  private inputArray?: HeapArray
  private outputArray?: HeapArray

  constructor(module: RubberBandModule) {
    this.module = module
  }

  private study(): void {
    // Process next samples
    if (this.kernel && this.buffer && this.inputArray) {
      const channelCount = this.buffer.length
      const frameSize = this.inputArray.getLength()
      for (let pos = 0; pos < this.endPos; pos += frameSize) {
        const start = pos
        const end = Math.min(pos + frameSize, this.endPos)
        for (let channel = 0; channel < channelCount; ++channel) {
          this.inputArray.getChannelArray(channel).set(this.buffer[channel].slice(start, end))
        }
        this.kernel.study(this.inputArray.getHeapAddress(), end - start, end >= this.endPos)
      }
    }
  }

  private process(start: number): number {
    // Process next samples
    if (this.kernel && this.buffer && this.inputArray && start <= this.endPos) {
      const frameSize = this.inputArray.getLength()
      const channelCount = this.buffer.length
      const end = Math.min(start + frameSize, this.endPos)
      for (let channel = 0; channel < channelCount; ++channel) {
        this.inputArray.getChannelArray(channel).set(this.buffer[channel].slice(start, end))
      }
      const size = end - start
      console.info(`process(${this.inputArray.getHeapAddress()}, ${size}, ${end >= this.endPos}) using start=${start} and end=${end}`)
      this.kernel.process(this.inputArray.getHeapAddress(), size, end >= this.endPos)
      return size
    }
    return 0
  }

  pull(channels: Float32Array[]): void {
    if (this.kernel && this.outputArray && this.counter < this.endPos) {
      const sampleCount = this.kernel.retrieve(this.outputArray.getHeapAddress(), channels[0].length)

      if (sampleCount) {
        for (let channel = 0; channel < channels.length; ++channel) {
          channels[channel].set(this.outputArray.getChannelArray(channel))
        }
        this.process(this.counter + PRE_BUFFER_SIZE)

        if (this.counter === 0 || this.counter % (128 * 10) === 0) {
          console.log(`[PitchShiftMockup] Pulled ${this.counter} samples`)
        }
      }
      this.counter += sampleCount
    }
  }

  restart(position: number = 0) {
    this.counter = position
    if (this.buffer && this.buffer.length > 0) {
      console.info(`Restarting`)
      const channelCount = this.buffer.length
      this.endPos = channelCount > 0 ? this.buffer[0].length : 0
      this.inputArray = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)
      this.outputArray = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)
      console.info('Studying')
      this.study()
      console.info(`Processing first ${PRE_BUFFER_SIZE} samples`)
      let processedSamples = 0
      do {
        processedSamples += this.process(this.counter + processedSamples)
      } while (processedSamples < PRE_BUFFER_SIZE)
      console.info(`Finished restarting`)
    } else {
      this.endPos = 0
      this.kernel = undefined
      this.inputArray = undefined
      this.outputArray = undefined
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    this.buffer = buffer
    this.restart()
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[PitchShiftMockup] Set pitch scale to ${pitchScale}`)
    this.pitchScale = pitchScale
    this.restart(this.counter)
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[PitchShiftMockup] Set time ratio to ${timeRatio}`)
    this.pitchScale = timeRatio
    this.restart(Math.round(this.counter * timeRatio))
  }

  reset(): void {
    console.log(`[PitchShiftMockup] Reset`)
    this.counter = 0
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

export default RubberBandSource