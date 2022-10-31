import HeapArray from './HeapArray'
import * as createModule from '../../wasm/build/rubberband.js'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource {
  private module: EmscriptenModule | undefined
  private kernel: any | undefined
  private readonly frameSize: number
  private pitchScale: number = 1
  private timeRatio: number = 1
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined
  private playPosition: number = 0
  private endPosition: number = 0
  private playing: boolean = false
  private ready: boolean = false
  public onReadyChanged?: (ready: boolean) => void


  public constructor(sampleRate: number, options?: {
    pitchScale?: number,
    timeRate?: number,
    frameSize?: number
  }) {
    this.frameSize = options?.frameSize || RENDER_QUANTUM_FRAMES
    this.setPitchScale(options?.pitchScale || 1)
    this.setTimeRatio(options?.timeRate || 1)
    void this.getModule()
  }

  public close() {
    this.kernel?.close()
    this.inputArray?.close()
    this.outputArray?.close()
  }

  public getModule = async (): Promise<EmscriptenModule> => {
    if (!this.module) {
      this.module = await createModule()
    }
    if (!this.module) {
      throw new Error('createModule returned nothing')
    }
    return this.module
  }

  public isReady(): boolean {
    return this.ready
  }

  public async setBuffer(buffer: Float32Array[]) {
    this.setReady(false)
    this.kernel?.close()
    this.inputArray?.close()
    this.outputArray?.close()
    if (buffer.length > 0) {
      this.endPosition = buffer[0].length
      const module = await this.getModule()
      this.kernel = new (module as any).RubberBandSource(sampleRate, buffer.length, RENDER_QUANTUM_FRAMES * 8)
      this.kernel.setPitchScale(this.pitchScale)
      this.kernel.setTimeRatio(this.timeRatio)
      this.inputArray = new HeapArray(module, this.endPosition, buffer.length)
      for (let channel = 0; channel < buffer.length; ++channel) {
        this.inputArray.getChannelArray(channel).set(buffer[channel])
      }
      this.outputArray = new HeapArray(module, this.frameSize, buffer.length)
      this.kernel.setBuffer(this.inputArray.getHeapAddress(), this.inputArray.getLength())
      this.setReady(true)
    } else {
      this.kernel = undefined
      this.inputArray = undefined
      this.outputArray = undefined
    }
  }

  public setTimeRatio(tempo: number) {
    this.timeRatio = tempo
    this.kernel?.setTimeRatio(tempo)
  }

  public setPitchScale(pitch: number) {
    this.pitchScale = pitch
    this.kernel?.setPitchScale(this.pitchScale)
  }

  public start() {
    this.playing = true
  }

  public stop() {
    this.playing = false
  }

  public pull(channels: Float32Array[]): void {
    if (this.kernel && this.outputArray && this.playing && this.playPosition < this.endPosition) {
      this.kernel.retrieve(this.outputArray.getHeapAddress(), this.frameSize)
      for (let channel = 0; channel < channels.length; ++channel) {
        channels[channel].set(this.outputArray.getChannelArray(channel))
      }
    }
  }

  private setReady(ready: boolean) {
    if (this.ready != ready) {
      this.ready = ready
      if (this.onReadyChanged) {
        this.onReadyChanged(this.ready)
      }
    }
  }

  public get samplesAvailable(): number {
    return this.kernel?.getSamplesAvailable() || 0
  }
}

export { RubberBandSource }