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
  private processCounter: number = 0
  private retrieveCounter: number = 0
  private endPos: number = 0
  private buffer?: Float32Array[]
  private inputBuffer?: HeapArray
  private outputBuffer?: HeapArray

  constructor(module: RubberBandModule) {
    this.module = module
  }

  private study(): void {
    if (this.kernel && this.buffer && this.buffer.length > 0) {
      const channelCount = this.buffer.length
      const sampleSize = this.buffer[0].length
      const inputArray = new HeapArray(this.module, sampleSize, channelCount)
      for (let channel = 0; channel < channelCount; ++channel) {
        for (let s = 0; s < sampleSize; s++) {
          inputArray.getChannelArray(channel)[s] = this.buffer[channel][s]
        }
        //inputArray.getChannelArray(channel).set(this.buffer[channel])
      }
      this.kernel.study(inputArray.getHeapAddress(), sampleSize, true)
      inputArray.close()
    }
  }

  private processRequiredSamples() {
    if (this.kernel && this.inputBuffer && this.buffer) {
      const channelCount = this.buffer.length
      let samplesRequired = this.kernel.getSamplesRequired()
      const start = this.processCounter
      const end = this.processCounter + samplesRequired
      while (samplesRequired > 0) {
        for (let channel = 0; channel < channelCount; ++channel) {
          for (let s = 0; s < samplesRequired; s++) {
            this.inputBuffer.getChannelArray(channel)[s] = this.buffer[channel][this.processCounter + s]
          }
          //this.inputBuffer.getChannelArray(channel).set(this.buffer[channel].subarray(start, end))
        }
        const final = this.processCounter + samplesRequired >= this.buffer[0].length
        console.info(`process(#, ${samplesRequired}, ${final}) using start=${start} and end=${end}`)
        this.kernel.process(this.inputBuffer.getHeapAddress(), samplesRequired, final)
        this.processCounter += samplesRequired
        samplesRequired = this.kernel.getSamplesRequired()
      }
    }
  }

  private process(start: number): number {
    // Process next samples
    if (this.kernel && this.buffer && this.inputBuffer && start <= this.endPos) {
      const frameSize = this.inputBuffer.getLength()
      const channelCount = this.buffer.length
      const end = Math.min(start + frameSize, this.endPos)
      const length = end - start
      for (let channel = 0; channel < channelCount; ++channel) {
        /*for (let s = 0; s < length; s++) {
          this.inputBuffer.getChannelArray(channel)[s] = this.buffer[channel][start + s]
        }*/
        this.inputBuffer.getChannelArray(channel).set(this.buffer[channel].slice(start, end))
      }
      console.info(`process(${this.inputBuffer.getHeapAddress()}, ${length}, ${end >= this.endPos}) using start=${start} and end=${end}`)
      this.kernel.process(this.inputBuffer.getHeapAddress(), length, end >= this.endPos)
      console.info(`Got ${this.kernel.getSamplesRequired()} samples required and ${this.kernel.available()} available`)
      return length
    }
    return 0
  }

  pull(channels: Float32Array[]): void {
    if (this.kernel && this.outputBuffer && this.retrieveCounter < this.endPos) {
      this.processRequiredSamples()
      const length = Math.min(this.kernel.available(), channels[0].length)
      if (length > 0) {
        const sampleCount = this.kernel.retrieve(this.outputBuffer.getHeapAddress(), length)
        if (sampleCount > 0) {
          for (let channel = 0; channel < channels.length; ++channel) {
            for (let s = 0; s < sampleCount; s++) {
              channels[channel][s] = this.outputBuffer.getChannelArray(channel)[s]
            }
            //channels[channel].set(this.outputArray.getChannelArray(channel))
          }

          console.log(`[PitchShiftMockup] Pulled ${this.retrieveCounter} samples`)
        }
        this.retrieveCounter += sampleCount
      }
    }
  }

  restart(position: number = 0) {
    this.retrieveCounter = position
    this.processCounter = position
    if (this.buffer && this.buffer.length > 0) {
      console.info(`Restarting`)
      const channelCount = this.buffer.length
      this.endPos = channelCount > 0 ? this.buffer[0].length : 0
      this.inputBuffer = new HeapArray(this.module, PRE_BUFFER_SIZE, channelCount)
      this.outputBuffer = new HeapArray(this.module, PRE_BUFFER_SIZE, channelCount)
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)
      console.info('Studying')
      this.study()

      this.processRequiredSamples()

      console.info(`Finished restarting`)
    } else {
      this.endPos = 0
      this.kernel = undefined
      this.inputBuffer = undefined
      this.outputBuffer = undefined
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    this.buffer = buffer
    this.restart()
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[PitchShiftMockup] Set pitch scale to ${pitchScale}`)
    this.pitchScale = pitchScale
    this.restart(this.retrieveCounter)
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[PitchShiftMockup] Set time ratio to ${timeRatio}`)
    this.pitchScale = timeRatio
    this.restart(Math.round(this.retrieveCounter * timeRatio))
  }

  reset(): void {
    console.log(`[PitchShiftMockup] Reset`)
    this.retrieveCounter = 0
    this.processCounter = 0
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

export default RubberBandSource