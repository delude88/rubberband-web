import { RubberBandSource } from './RubberBandSource'


class RubberbandSourceProcessor extends AudioWorkletProcessor {
  private readonly api: RubberBandSource
  private running: boolean = true
  private playing: boolean = false

  constructor() {
    super()
    this.api = new RubberBandSource(sampleRate)
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
        case 'play': {
          this.playing = true
          break
        }
        case 'stop': {
          this.playing = false
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
      .catch((err) => {
        // TODO: Replace by sending error to host
        console.error(err)
      })
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

registerProcessor('rubberband-source-processor', RubberbandSourceProcessor)