import { PitchShiftSource } from './PitchShiftSource'
import HeapArray from './HeapArray'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private kernel?: RubberBandAPI
  private pitchScale: number = 1
  private timeRatio: number = 1
  private buffer?: Float32Array[]
  private result: Float32Array[] = []
  private inputBuffer?: HeapArray
  private outputBuffer?: HeapArray

  private inputProcessPointer: number = 0
  private outputWritePointer: number = 0
  private outputReadPointer: number = 0

  constructor(module: RubberBandModule) {
    this.module = module
  }

  private fetchAvailable() {
    console.log("fetchAvailable called")
    console.time('fetchAvailable')
    if(this.kernel && this.outputBuffer) {
      let available = this.kernel.available()
      while (available > 0) {
        const actual = this.kernel.retrieve(this.outputBuffer.getHeapAddress(), Math.min(available, RENDER_QUANTUM_FRAMES))
        for (let c = 0; c < this.outputBuffer.getChannelCount(); c++) {
          for (let s = 0; s < actual; s++) {
            this.result[c][this.outputWritePointer + s] = this.outputBuffer.getChannelArray(c)[s]
          }
        }
        this.outputWritePointer += actual
        available = this.kernel.available()
      }
    }
    console.timeEnd('fetchAvailable')
  }

  private processRequiredSamples() {
    console.log("processRequiredSamples CALLED")
    if (this.kernel && this.buffer && this.inputBuffer && this.outputBuffer) {
      console.time('processRequiredSamples')
      let requiredSampleCount = this.kernel.getSamplesRequired()
      while (requiredSampleCount > 0) {
        console.log("requiredSampleCount", requiredSampleCount)
        for (let frame = 0; frame < requiredSampleCount; frame += RENDER_QUANTUM_FRAMES) {
          const start = this.inputProcessPointer + frame
          const length = Math.min(requiredSampleCount, RENDER_QUANTUM_FRAMES)
          const end = start + length
          const final = end >= this.buffer[0].length
          for (let c = 0; c < this.buffer.length; ++c) {
            for (let s = 0; s < length; ++s) {
              this.inputBuffer.getArray()[c][s] = this.buffer[c][start + s]
            }
            //this.inputBuffer.getChannelArray(c).set(this.buffer[c].subarray(start, end))
          }
          console.log(`this.kernel.process(${this.inputBuffer.getHeapAddress()}, ${length}, ${final}) or from ${start} to ${end}`)
          this.kernel.process(this.inputBuffer.getHeapAddress(), length, final)
        }
        this.inputProcessPointer += requiredSampleCount
        requiredSampleCount = this.kernel.getSamplesRequired()
      }
      console.timeEnd('processRequiredSamples')
      this.fetchAvailable();
    }
    console.log("processRequiredSamples ENDED")
    console.log(`[RubberBandSource] Processed ${this.inputProcessPointer}, written ${this.outputWritePointer} and read ${this.outputReadPointer} samples`)
  }

  private prepare() {
    if (this.buffer && this.buffer.length > 0) {
      const channelCount = this.buffer.length
      const sampleCount = this.buffer[0].length
      const outputSize = Math.round(sampleCount * this.timeRatio)
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)
      for (let c = 0; c < channelCount; c++) {
        this.result[c] = new Float32Array(outputSize)
      }

      const inputBuffer = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)
      this.inputBuffer = inputBuffer
      this.outputBuffer = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)

      // Study all
      console.time('Study')
      for (let frame = 0; frame < sampleCount; frame += RENDER_QUANTUM_FRAMES) {
        for (let c = 0; c < channelCount; c++) {
          /*for (let s = 0; s < RENDER_QUANTUM_FRAMES; ++s) {
            this.inputBuffer.getArray()[c][s] = this.buffer[c][frame + s]
          }*/
          inputBuffer.getChannelArray(c).set(this.buffer[c].slice(frame, frame + RENDER_QUANTUM_FRAMES))
          //inputBuffer.getChannelArray(c).set(this.buffer[c].subarray(frame, frame + RENDER_QUANTUM_FRAMES))
        }

        // Validate
        for (let c = 0; c < inputBuffer.getChannelCount(); c++) {
          console.assert(inputBuffer.getLength() === RENDER_QUANTUM_FRAMES, 'Same sample length')
          for (let s = 0; s < RENDER_QUANTUM_FRAMES; s++) {
            console.assert(inputBuffer.getArray()[c][s] === this.buffer[c][frame + s], 'Same sample')
          }
        }

        const final = frame + RENDER_QUANTUM_FRAMES > sampleCount
        this.kernel.study(this.inputBuffer.getHeapAddress(), RENDER_QUANTUM_FRAMES, final)
      }
      console.timeEnd('Study')

      this.processRequiredSamples()
    }
  }

  pull(channels: Float32Array[]): void {
    if (this.outputWritePointer - this.outputReadPointer > RENDER_QUANTUM_FRAMES) {
      // Enough
      for(let c = 0; c < channels.length; c++) {
        channels[c].set(this.result[c].slice(this.outputReadPointer, RENDER_QUANTUM_FRAMES))
      }
      this.outputReadPointer += RENDER_QUANTUM_FRAMES
    }
    this.processRequiredSamples()
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
    this.pitchScale = timeRatio
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