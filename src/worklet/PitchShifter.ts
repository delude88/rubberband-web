import * as createModule from '../../wasm/build/rubberband.js'
import HeapArray from './HeapArray'

const RENDER_QUANTUM_FRAMES = 128

interface PitchShifterOptions {
  highQuality?: boolean,
  numSamples?: number,
  pitch?: number,
  tempo?: number
  onReady?: (pitchShifter: PitchShifter) => void
}

class PitchShifter {
  private kernel: any
  private readonly channelCount: number
  private readonly numSamples: number
  private readonly highQuality: boolean
  private tempo: number = 1
  private pitch: number = 1
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined

  public constructor(sampleRate: number, channelCount: number, options?: PitchShifterOptions) {
    this.numSamples = options?.numSamples || RENDER_QUANTUM_FRAMES
    this.channelCount = channelCount
    this.highQuality = options?.highQuality || false
    this.pitch = options?.pitch || 1
    this.tempo = options?.tempo || 1
    this.init(channelCount, options?.onReady)
  }

  public get ready(): boolean {
    return !!this.kernel && !!this.inputArray && !!this.outputArray
  }

  private init(channelCount: number, onReady?: (pitchShifter: PitchShifter) => void) {
    this.inputArray?.close()
    this.outputArray?.close()
    createModule()
      .then((module: any) => {
        this.kernel = new module.RealtimeRubberBand(sampleRate, channelCount, this.highQuality)
        this.inputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
        this.outputArray = new HeapArray(module, RENDER_QUANTUM_FRAMES, channelCount)
        if (this.pitch !== 1) {
          this.kernel.setPitch(this.pitch)
        }
        if (this.tempo !== 1) {
          this.kernel.setTempo(this.tempo)
        }
        if (onReady) {
          onReady(this)
        }
      })
  }

  public setTempo(tempo: number) {
    this.tempo = tempo
    if (this.kernel)
      this.kernel.setTempo(this.tempo)
  }

  public setPitch(pitch: number) {
    this.pitch = pitch
    if (this.kernel)
      this.kernel.setPitch(pitch)
  }

  public get samplesAvailable(): number {
    return this.kernel?.getSamplesAvailable() || 0
  }

  public push(channels: Float32Array[], numSamples?: number) {
    if (this.kernel && this.inputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        for (let channel = 0; channel < channelCount; ++channel) {
          this.inputArray.getChannelArray(channel).set(channels[channel])
        }
        this.kernel.push(this.inputArray.getHeapAddress(), numSamples || this.numSamples)
      }
    }
  }

  public pushSlice(channels: Float32Array[], start: number, end: number) {
    if (this.kernel && this.inputArray) {
      const len = end - start
      if (len > this.numSamples) {
        throw new Error(`Part is larger than number of samples: ${len} > ${this.numSamples}`)
      }
      const channelCount = channels.length
      if (channelCount > 0) {
        for (let channel = 0; channel < channelCount; ++channel) {
          this.inputArray.getChannelArray(channel).set(channels[channel].slice(start, end))
        }
        this.kernel.push(this.inputArray.getHeapAddress(), len)
      }
    }
  }

  public pull(channels: Float32Array[]): Float32Array[] {
    if (this.kernel && this.outputArray) {
      const channelCount = channels.length
      if (channelCount > 0) {
        const available = this.kernel.getSamplesAvailable()
        if (available >= this.numSamples) {
          this.kernel.pull(this.outputArray.getHeapAddress(), this.numSamples)
          for (let channel = 0; channel < channels.length; ++channel) {
            channels[channel].set(this.outputArray.getChannelArray(channel))
          }
        }
      }
    }
    return channels
  }

  public getVersion(): number {
    return this.kernel?.getVersion() || 0
  }

  public getChannelCount(): number {
    return this.channelCount
  }

  public isHighQuality(): boolean {
    return this.highQuality
  }
}

export { PitchShifter }