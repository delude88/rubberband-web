import { PitchShiftSource } from './PitchShiftSource'
import HeapArray from './HeapArray'
import { RubberBandFinal, RubberBandModule } from './RubberBandModule'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private kernel?: RubberBandFinal
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

  private prepare() {
    if (this.buffer && this.buffer.length > 0) {
      console.log('PREPARE')
      const channelCount = this.buffer.length
      const sampleCount = this.buffer[0].length
      this.kernel = new this.module.RubberBandFinal(sampleRate, channelCount, sampleCount, this.timeRatio, this.pitchScale)

      //TODO:  Check input array itself
      const inputBuffer = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)
      for (let c = 0; c < this.buffer.length; ++c) {
        for (let s = 0; s < this.buffer[c].length; ++s) {
          this.buffer[c][s] *= 1.2
        }
      }

      this.inputBuffer = inputBuffer
      this.outputBuffer = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, channelCount)

      // Study all
      console.time('Study')
      let counter = 0
      for (let frame = 0; frame < sampleCount; frame += RENDER_QUANTUM_FRAMES) {
        const length = Math.min(sampleCount - frame, RENDER_QUANTUM_FRAMES)
        const end = frame + length
        for (let c = 0; c < channelCount; c++) {
          this.inputBuffer.getChannelArray(c).set(this.buffer[c].subarray(frame, end))
        }
        //console.log(`this.kernel.push(${this.inputBuffer.getHeapAddress()}, ${length}) am now at ${frame} of ${sampleCount}`)
        this.kernel.push(this.inputBuffer.getHeapAddress(), length)
        counter += length
      }
      console.timeEnd('Study')
    }
  }

  pull(channels: Float32Array[]): void {
    if (this.outputWritePointer - this.outputReadPointer > RENDER_QUANTUM_FRAMES) {
      // Enough
      for (let c = 0; c < channels.length; c++) {
        channels[c].set(this.result[c].slice(this.outputReadPointer, RENDER_QUANTUM_FRAMES))
      }
      this.outputReadPointer += RENDER_QUANTUM_FRAMES
    }
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