import { PitchShiftSource } from './PitchShiftSource'


class PitchShiftMockup implements PitchShiftSource {
  private counter = 0

  pull(channels: Float32Array[]): void {
    if (channels.length > 0) {
      if (this.counter % sampleRate === 0) {
        console.log(`[PitchShiftMockup] Pulled ${this.counter} samples`)
      }
      this.counter += channels[0].length
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    if (buffer.length > 0) {
      console.log(`[PitchShiftMockup] Set buffer for ${buffer.length} channels of ${buffer[0].length} samples each`)
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
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

class PitchShiftSourceProcessor extends AudioWorkletProcessor {
  private readonly api: PitchShiftSource
  private running: boolean = true
  private playing: boolean = false

  constructor() {
    super()
    this.api = new PitchShiftMockup()
    this.port.onmessage = ({ data }) => {
      const { event } = data
      switch (event) {
        case 'buffer': {
          this.setBuffer((data.buffer as ArrayBuffer[]).map(buf => new Float32Array(buf)))
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
  }

  start() {
    this.playing = true
  }

  stop() {
    this.playing = false
  }

  setPitch(pitch: number) {
    this.api.setPitchScale(pitch)
  }

  setTempo(tempo: number) {
    this.api.setTimeRatio(tempo)
  }

  setBuffer(buffer: Float32Array[]) {
    this.api.setBuffer(buffer)
  }

  close() {
    this.api.close()
    this.port.onmessage = null
    this.running = false
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.api && this.playing) {
      this.api.pull(outputs[0])
    }
    return this.running
  }
}

registerProcessor('pitch-shift-source-processor', PitchShiftSourceProcessor)