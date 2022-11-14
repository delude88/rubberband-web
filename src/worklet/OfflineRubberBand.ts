import { OfflinePitchShift } from './OfflinePitchShift'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'
import { DualHeapChannelManager } from '../wasm/HeapChannelManager'

class OfflineRubberBand implements OfflinePitchShift {
  private readonly module: RubberBandModule
  private pitchScale: number = 1
  private timeRatio: number = 1
  private input?: Float32Array[]
  private kernel?: RubberBandAPI
  private heap?: DualHeapChannelManager

  private processPtr: number = 0
  private retrievePtr: number = 0
  private readPtr: number = 0

  constructor(module: RubberBandModule) {
    this.module = module
  }

  private fetch() {
    console.time('[OfflineRubberBand] fetch')
    let counter = 0
    if (this.kernel && this.heap) {
      let available = this.kernel.available()
      while (available > 0) {
        const actual = this.kernel.retrieve(this.heap.getOutputChannelPtr(0, this.retrievePtr), available)
        counter += actual
        this.retrievePtr += actual
        available = this.kernel.getSamplesRequired()
      }
    }
    console.log(`Fetched ${counter}`)
    console.timeEnd('[OfflineRubberBand] fetch')
  }

  private process() {
    console.time('[OfflineRubberBand] process')
    if (this.kernel && this.heap) {
      let samples = this.kernel.getSamplesRequired()
      while (samples > 0) {
        this.kernel.process(this.heap.getInputChannelPtr(0, this.processPtr), samples, this.processPtr + samples > this.heap.sampleCount)
        this.processPtr += samples
        this.fetch()
        samples = this.kernel.getSamplesRequired()
      }
    }
    //this.fetch()
    console.timeEnd('[OfflineRubberBand] process')
  }

  private prepare(): void {
    this.processPtr = 0
    this.retrievePtr = 0
    this.readPtr = 0

    if (this.input && this.input.length > 0) {
      const channelCount = this.input.length
      const sampleCount = this.input[0].length
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)

      this.heap = new DualHeapChannelManager(this.module, sampleCount, channelCount)

      for (let c = 0; c < channelCount; ++c) {
        for (let s = 0; s < sampleCount; ++s) {
          this.heap.getInputChannel(c)[s] = this.input[c][s]
        }
      }

      console.log('[OfflineRubberBand] Studying')
      this.kernel.study(this.heap.pointer, sampleCount, true)
      console.log(`[OfflineRubberBand] Studied ${channelCount} channels with ${sampleCount} samples each`)
      //this.process()
    }
  }

  pull(channels: Float32Array[]): void {
    if (this.heap && this.retrievePtr > this.readPtr) {
      const channelCount = Math.min(channels.length, this.heap.channelCount)
      if (channelCount > 0) {
        const length = Math.min(channels[0].length, this.retrievePtr - this.readPtr)
        console.log(`[OfflineRubberBand] Feeding ${length}`)
        const start = this.readPtr
        const end = start + length
        for (let c = 0; c < channelCount; ++c) {
          channels[c].set(this.heap.getOutputChannel(c).subarray(start, end))
        }
      }
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    // Validate buffer
    if (buffer.length > 0) {
      for (let c = 0; c < buffer.length; ++c) {
        if (buffer[c].byteLength === 0) {
          throw new Error(`[OfflineRubberBand] setBuffer: buffer[${c}].byteLength === 0`)
        } else {
          console.log(`[OfflineRubberBand] setBuffer: buffer[${c}].byteLength === ${buffer[c].byteLength}`)
        }
      }
    }
    this.input = buffer
    this.prepare()
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[OfflineRubberBand] Set pitch scale to ${pitchScale}`)
    this.pitchScale = pitchScale
    this.prepare()
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[OfflineRubberBand] Set time ratio to ${timeRatio}`)
    this.timeRatio = timeRatio
    this.prepare()
  }

  reset(): void {
    console.log(`[OfflineRubberBand] Reset`)
    this.prepare()
  }

  close(): void {
    console.log(`[OfflineRubberBand] Close`)
  }
}

export { OfflineRubberBand }