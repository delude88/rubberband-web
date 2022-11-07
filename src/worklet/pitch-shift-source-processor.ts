import { PitchShiftSource } from './PitchShiftSource'
import HeapArray from './HeapArray'
import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from './RubberBandModule'
import RubberBandSource from './RubberBandSource'

class PitchShiftMockup implements PitchShiftSource {
  private readonly module: EmscriptenModule
  private inputArray?: HeapArray
  private useArray = true
  private endPos: number = 0
  private counter = 0
  private buffer?: Float32Array[]

  constructor(module: EmscriptenModule) {
    this.module = module
  }

  pull(channels: Float32Array[]): void {
    if (this.buffer && this.counter < this.endPos) {
      const sampleCount = channels[0].length
      const channelCount = channels.length
      if (channelCount > 0) {
        for (let channel = 0; channel < channelCount; ++channel) {
          if (this.useArray) {
            if (this.inputArray) {
              channels[channel].set(this.inputArray.getChannelArray(channel).slice(this.counter, this.counter + sampleCount))
            }
          } else {
            for (let sample = 0; sample < sampleCount; ++sample) {
              channels[channel][sample] = this.buffer[channel][this.counter + sample]
            }
          }
        }
        if (this.counter === 0 || this.counter % (128 * 10) === 0) {
          console.log(`[PitchShiftMockup] Pulled ${this.counter} samples`)
          console.info(`buffer[0][${this.counter}] = ${this.buffer[0][this.counter]}`)
        }
      }
      this.counter = this.counter + sampleCount
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    this.buffer = buffer
    if (buffer.length > 0) {
      console.log(`[PitchShiftMockup] Setting buffer for ${buffer.length} channels of ${buffer[0].length} samples each`)
      this.endPos = buffer[0].length
    }
    this.inputArray = new HeapArray(this.module, buffer[0].length, buffer.length)
    for (let channel = 0; channel < buffer.length; ++channel) {
      this.inputArray.getChannelArray(channel).set(buffer[channel])
    }
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[PitchShiftMockup] Set pitch scale to ${pitchScale}`)
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[PitchShiftMockup] Set time ratio to ${timeRatio}`)
  }

  reset(): void {
    console.log(`[PitchShiftMockup] Reset`)
    this.counter = 0
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

class PitchShiftSourceProcessor extends AudioWorkletProcessor implements AudioWorkletProcessorImpl {
  private api?: PitchShiftSource
  private running: boolean = true
  private playing: boolean = false
  private buffer?: Float32Array[]
  private pitch: number = 1
  private tempo: number = 1

  constructor() {
    super()
    this.port.onmessage = ({ data }) => {
      const { event } = data
      switch (event) {
        case 'buffer': {
          const buffer = (data.buffer as ArrayBuffer[]).map(buf => new Float32Array(buf))
          this.setBuffer(buffer)
          break
        }
        case 'pitch': {
          this.setPitch(data.pitch)
          break
        }
        case 'tempo': {
          this.setTempo(data.tempo)
          break
        }
        case 'start': {
          this.start()
          break
        }
        case 'stop': {
          this.stop()
          break
        }
        case 'close': {
          this.close()
          break
        }
      }
    }
    createModule()
      .then((module: RubberBandModule) => {
        this.api = new RubberBandSource(module)
        if (this.pitch !== 1) {
          this.api.setPitchScale(this.pitch)
        }
        if (this.tempo !== 1) {
          this.api.setTimeRatio(this.tempo)
        }
        if (this.buffer) {
          this.api.setBuffer(this.buffer)
        }
      })
  }

  start() {
    console.log(`[PitchShiftSourceProcessor] start`)
    this.playing = true
  }

  stop() {
    console.log(`[PitchShiftSourceProcessor] stop`)
    this.playing = false
  }

  setPitch(pitch: number) {
    console.log(`[PitchShiftSourceProcessor] setPitch(${pitch})`)
    this.pitch = pitch
    this.api?.setPitchScale(pitch)
  }

  setTempo(tempo: number) {
    console.log(`[PitchShiftSourceProcessor] setTempo(${tempo})`)
    this.tempo = tempo
    this.api?.setTimeRatio(tempo)
  }

  setBuffer(buffer: Float32Array[]) {
    console.log(`[PitchShiftSourceProcessor] setBuffer(buffer: ${buffer.length} channels a ${buffer.length > 0 ? buffer[0].length : 0} samples)`)
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
    this.api?.setBuffer(buffer)
  }

  close() {
    console.log(`[PitchShiftSourceProcessor] close`)
    this.api?.close()
    this.port.onmessage = null
    this.running = false
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    if (this.api && this.playing) {
      this.api.pull(outputs[0])
    }
    return this.running
  }
}

registerProcessor('pitch-shift-source-processor', PitchShiftSourceProcessor)