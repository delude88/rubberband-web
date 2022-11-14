import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from './RubberBandModule'
import { OfflineRubberBand } from './OfflineRubberBand'

class OfflinePitchShiftProcessor extends AudioWorkletProcessor implements AudioWorkletProcessorImpl {
  private api?: OfflineRubberBand
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
        this.api = new OfflineRubberBand(module)
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
    if (this.api && this.playing && outputs) {
      this.api.pull(outputs[0])
    }
    return this.running
  }
}

registerProcessor('offline-pitch-shift-processor', OfflinePitchShiftProcessor)