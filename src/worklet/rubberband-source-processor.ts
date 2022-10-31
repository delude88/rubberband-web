import {RealtimeRubberBand} from "./RealtimeRubberBand"

class RubberBandProcessor extends AudioWorkletProcessor {
  private api: RealtimeRubberBand | undefined;
  private running: boolean = true;
  private pitch: number = 1;
  private tempo: number = 1;
  private highQuality: boolean = false
  private buffer: Float32Array[]

  constructor() {
    super();
    this.port.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const event = data[0] as string
      const payload = data[1]
      console.log("port.onmessage", event, payload)
      switch (event) {
        case "pitch": {
          this.pitch = payload
          if (this.api)
            this.api.setPitch(this.pitch)
          break;
        }
        case "quality": {
          this.highQuality = payload
          break;
        }
        case "tempo": {
          this.tempo = payload
          if (this.api)
            this.api.setTempo(this.tempo)
          break;
        }
        case "close": {
          this.close();
          break;
        }
      }
    }
  }

  getApi(channelCount: number): RealtimeRubberBand {
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

  setBuffer(buffer: Float32Array[]) {

  }

  close() {
    this.port.onmessage = null
    this.running = false;
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const numChannels = inputs[0]?.length || outputs[0]?.length
    if (numChannels > 0) {
      const api = this.getApi(numChannels)

      if (inputs?.length > 0) {
        api.push(inputs[0])
      }

      if (outputs?.length > 0) {
        const outputLength = outputs[0][0].length
        if (api.samplesAvailable >= outputLength) {
          api.pull(outputs[0])
        }
      }
    }
    return this.running;
  }
}

registerProcessor('rubberband-source-processor', RubberBandProcessor)