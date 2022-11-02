import { RubberBandPitchShiftSource } from './RubberBandPitchShiftSource'


class RubberbandSourceProcessor extends AudioWorkletProcessor {
  private readonly api: RubberBandPitchShiftSource
  private running: boolean = true

  constructor() {
    super()
    this.api = new RubberBandPitchShiftSource(sampleRate)
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
          break
        }
        case 'stop': {
          break
        }
        case 'close': {
          this.close()
          break
        }
      }
    }
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
    if (this.api) {
      this.api.pull(outputs[0])
    }
    return this.running
  }
}

registerProcessor('rubberband-source-processor', RubberbandSourceProcessor)