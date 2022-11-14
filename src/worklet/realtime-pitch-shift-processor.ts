import { RealtimeRubberBand } from './RealtimeRubberBand'
import * as createModule from '../../wasm/build/rubberband'
import { RubberBandModule } from './RubberBandModule'

class RealtimePitchShiftProcessor extends AudioWorkletProcessor {
  private _module: RubberBandModule | undefined
  private _api: RealtimeRubberBand | undefined
  private running: boolean = true
  private pitch: number = 1
  private tempo: number = 1
  private highQuality: boolean = false

  constructor() {
    super()
    this.port.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const event = data[0] as string
      const payload = data[1]
      console.log('port.onmessage', event, payload)
      switch (event) {
        case 'pitch': {
          this.pitch = payload
          if (this._api)
            this._api.pitchScale = this.pitch
          break
        }
        case 'quality': {
          this.highQuality = payload
          break
        }
        case 'tempo': {
          this.tempo = payload
          if (this._api)
            this._api.timeRatio = this.tempo
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
        this._module = module
      })
  }

  getApi(channelCount: number): RealtimeRubberBand | undefined {
    if (this._module) {
      if (
        !this._api ||
        this._api.channelCount !== channelCount ||
        this._api.highQuality !== this.highQuality
      ) {
        this._api = new RealtimeRubberBand(this._module, sampleRate, channelCount, {
          highQuality: this.highQuality,
          pitch: this.pitch,
          tempo: this.tempo
        })
        console.info(`RubberBand engine version ${this._api.version}`)
      }
    }
    return this._api
  }

  close() {
    this.port.onmessage = null
    this.running = false
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const numChannels = inputs[0]?.length || outputs[0]?.length
    if (numChannels > 0) {
      const api = this.getApi(numChannels)
      if (api) {
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
    }
    return this.running
  }
}

registerProcessor('realtime-pitch-shift-processor', RealtimePitchShiftProcessor)