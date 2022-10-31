import HeapArray from './HeapArray'

const RENDER_QUANTUM_FRAMES = 128

const PRERENDER_SAMPLES = 1024

class OfflineRubberBand {
  private readonly module: EmscriptenModule
  private readonly kernel: any
  private tempo: number = 1
  private pitch: number = 1
  private inputArray: HeapArray | undefined
  private outputArray: HeapArray | undefined
  private ready: boolean = false
  public onReadyChanged?: (ready: boolean) => void
  public onStarted?: () => void
  public onPaused?: () => void
  public onEnded?: () => void
  private playPosition: number = 0

  public constructor(module: EmscriptenModule, sampleRate: number, options?: {
    pitch?: number,
    tempo?: number
  }) {
    this.module = module
    this.kernel = new (module as any).OfflineRubberBand(sampleRate)
    this.setPitch(options?.pitch || 1)
    this.setTempo(options?.tempo || 1)
  }

  public isReady(): boolean {
    return this.ready
  }

  public setBuffer(buffer: Float32Array[]) {
    if (buffer.length > 0) {
      this.inputArray = new HeapArray(this.module, buffer[0].length, buffer.length)
      for (let channel = 0; channel < buffer.length; ++channel) {
        this.inputArray.getChannelArray(channel).set(buffer[channel])
      }
      this.outputArray = new HeapArray(this.module, RENDER_QUANTUM_FRAMES, buffer.length)
      this.playPosition = 0
      this.prepareBuffer()
    } else {
      this.inputArray = undefined
      this.outputArray = undefined
    }
  }

  public setTempo(tempo: number) {
    this.tempo = tempo
    this.kernel.setTempo(this.tempo)
    this.prepareBuffer()
  }

  public setPitch(pitch: number) {
    this.pitch = pitch
    this.kernel.setPitch(pitch)
    this.prepareBuffer()
  }

  public pull(channels: Float32Array[], numSamples: number = RENDER_QUANTUM_FRAMES): void {
    if (!this.inputArray) {
      throw new Error('Input was not ready, please check using isReady() first')
    }
    if (!this.outputArray) {
      throw new Error('Output was not ready, please check using isReady() first')
    }
    // Prerender next numSamples samples (for later)
    this.kernel.process(this.inputArray.getHeapAddress(), this.playPosition + numSamples, numSamples)
    // Extract exact numSamples samples
    const available = this.kernel.getSamplesAvailable()
    if (available < numSamples) {
      console.error('Buffer under run')
      return
    }
    this.kernel.pull(this.outputArray.getHeapAddress(), numSamples)
    for (let channel = 0; channel < channels.length; ++channel) {
      channels[channel].set(this.outputArray.getChannelArray(channel))
    }
  }

  private prepareBuffer() {
    this.setReady(false)
    if (this.inputArray) {
      // Study whole buffer
      this.kernel.study(this.inputArray.getHeapAddress(), this.inputArray.getLength())
      // Prerender
      this.kernel.process(this.inputArray.getHeapAddress(), this.playPosition, Math.min(PRERENDER_SAMPLES, this.inputArray.getLength()))
    }
    this.setReady(true)
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

  public getVersion(): number {
    return this.kernel?.getVersion() || 0
  }
}

export { OfflineRubberBand }