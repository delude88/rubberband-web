class HeapChannelManager {
  protected readonly _module: EmscriptenModule
  protected _channels: Float32Array[] = []
  protected _sampleCount: number = 0
  protected _channelCount: number = 0
  protected _ptr: number = 0
  protected _byteSize: number = 0
  protected _channelByteSize: number = 0

  public constructor(module: EmscriptenModule, sampleCount: number, channelCount: number) {
    this._module = module
    this.allocateHeap(sampleCount, channelCount)
  }

  public get pointer(): number {
    return this._ptr
  }

  public get module(): EmscriptenModule {
    return this._module
  }

  public get channelCount(): number {
    return this._channelCount
  }

  public setChannelCount(channelCount: number) {
    this.allocateHeap(this._sampleCount, channelCount)
  }

  public get sampleCount(): number {
    return this._sampleCount
  }

  public setSampleCount(sampleCount: number) {
    this.allocateHeap(sampleCount, this._channelCount)
  }

  public getChannel(index: number): Float32Array {
    if (index < 0 || this._channelCount < index) {
      throw new Error('Channel index out of bounce')
    }
    return this._channels[index]
  }

  public getChannelPointer(index: number, offset: number = 0) {
    if (index < 0 || this._channelCount < index) {
      throw new Error('Channel index out of bounce')
    }
    const ptr = this._ptr + this._channelByteSize * index + offset * Float32Array.BYTES_PER_ELEMENT
    if (ptr >= this._byteSize) {
      throw new Error('Offset too large')
    }
    return ptr
  }

  public close(): void {
    if (this._ptr)
      this._module?._free(this._ptr)
  }

  protected allocateHeap(sampleCount: number, channelCount: number) {
    if (
      this._ptr &&
      this._sampleCount === sampleCount &&
      this._channelCount === channelCount
    ) {
      return
    }
    // Store channels first
    const backup: Float32Array[] = []
    for (let c = 0; c < this._channels.length; ++c) {
      backup.push(new Float32Array(this._channels[c]))
    }
    this._sampleCount = sampleCount
    this._channelCount = channelCount
    this._channelByteSize = this._sampleCount * Float32Array.BYTES_PER_ELEMENT
    this._byteSize = this._channelCount * this._channelByteSize
    this._channels = []
    if (this._ptr) {
      console.info(`[HeapChannelManager] Free ${this._ptr}`)
      this.module?._free(this._ptr)
    }
    this._ptr = this._module._malloc(this._byteSize)
    console.info(`[HeapChannelManager] Malloc ${this._byteSize} at ${this._ptr}`)
    for (let c = 0; c < this._channelCount; ++c) {
      const startByteOffset = this._ptr + c * this._channelByteSize
      const endByteOffset = startByteOffset + this._channelByteSize
      this._channels[c] =
        this._module.HEAPF32.subarray(
          startByteOffset >> Uint16Array.BYTES_PER_ELEMENT,
          endByteOffset >> Uint16Array.BYTES_PER_ELEMENT)
      if (backup.length >= c + 1) {
        if (backup[c].length <= this._channels[c].length) {
          this._channels[c].set(backup[c])
        } else {
          this._channels[c].set(backup[c].slice(0, this._channels[c].length))
        }
      }
    }
  }
}

class DualHeapChannelManager extends HeapChannelManager {
  constructor(module: EmscriptenModule, sampleCount: number, channelCount: number) {
    super(module, sampleCount, channelCount * 2)
  }

  public get channelCount(): number {
    return this._channelCount / 2
  }

  public getInputChannel(index: number = 0): Float32Array {
    if (index >= this.channelCount) {
      throw new Error('Channel index out of bounce')
    }
    return this.getChannel(index)
  }

  public getInputChannels() {
    return this._channels.slice(0, this.channelCount)
  }

  public getOutputChannel(index: number = 0): Float32Array {
    if (index >= this.channelCount) {
      throw new Error('Channel index out of bounce')
    }
    return this.getChannel(index + this.channelCount)
  }

  public getOutputChannels() {
    return this._channels.slice(this.channelCount)
  }

  public getInputChannelPtr(index: number = 0, offset?: number): number {
    return this.getChannelPointer(index, offset)
  }

  public getOutputChannelPtr(index: number = 0, offset?: number): number {
    return this.getChannelPointer(index + this.channelCount, offset)

  }
}


export { HeapChannelManager, DualHeapChannelManager }