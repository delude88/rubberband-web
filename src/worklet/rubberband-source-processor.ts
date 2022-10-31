import {RealtimeRubberBand} from "./RealtimeRubberBand"

class RubberBandProcessor extends AudioWorkletProcessor {
  private api: RealtimeRubberBand | undefined;
  private running: boolean = true;
  private pitch: number = 1;
  private tempo: number = 1;
  private highQuality: boolean = false
  private buffer?: Float32Array[]

  constructor() {
    super();
    this.port.onmessage = ({data}) => {
      const {event} = data
      switch (event) {
        case "buffer": {
          this.setBuffer((data.buffer as Float32Array[]).map(buf => new Float32Array(buf)))
          break;
        }
        case "pitch": {
          this.setPitch(data.pitch)
          break;
        }
        case "quality": {
          this.setHighQuality(data.quality)
          break;
        }
        case "tempo": {
          this.setTempo(data.tempo)
          break;
        }
        case "close": {
          this.close();
          break;
        }
      }
    }
  }

  setPitch(pitch: number) {
    this.pitch = pitch
    if (this.api)
      this.api.setPitch(this.pitch)
  }

  setTempo(tempo: number) {
    this.tempo = tempo
    if (this.api)
      this.api.setTempo(this.tempo)
  }

  setBuffer(buffer: Float32Array[]) {
    this.buffer = buffer
  }

  setHighQuality(enabled: boolean) {
    this.highQuality = enabled
  }

  close() {
    this.port.onmessage = null
    this.running = false;
  }

  private prepare() {
    if(this.buffer) {
      this.kernel
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    return this.running;
  }

  private getApi(channelCount: number): RealtimeRubberBand {
    if (
      !this.api ||
      this.api.getChannelCount() !== channelCount ||
      this.api.isHighQuality() !== this.highQuality
    ) {
      this.api = new RealtimeRubberBand(sampleRate, channelCount, {
        highQuality: this.highQuality,
        pitch: this.pitch,
        tempo: this.tempo
      })
      this.api.setTempo(this.tempo)

      console.info("Rubberband engine version", this.api.getVersion())
    }
    return this.api
  }

}

registerProcessor('rubberband-source-processor', RubberBandProcessor)