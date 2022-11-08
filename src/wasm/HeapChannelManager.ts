class HeapChannelManager {
  private readonly _module: EmscriptenModule
  private _channels: Float32Array[] = []
  private _sampleCount: number = 0
  private _channelCount: number = 0
  private _ptr: number = 0
  private _byteSize: number = 0
  private _channelByteSize: number = 0

  public constructor(module: EmscriptenModule, sampleCount: number, channelCount: number) {
    this._module = module
    this.allocateHeap(sampleCount, channelCount)
  }

  public get heapAddress(): number {
    return this._ptr
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
      throw new Error('Out of bounce')
    }
    return this._channels[index]
  }

  public getChannelHeapAddress(index: number) {
    if (index < 0 || this._channelCount < index) {
      throw new Error('Out of bounce')
    }
    return this._ptr + this._channelByteSize * index
  }

  public close(): void {
    if (this._ptr)
      this._module?._free(this._ptr)
  }

  private allocateHeap(sampleCount: number, channelCount: number) {
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
      this.module?._free(this._ptr)
    }
    this._ptr = this._module._malloc(this._byteSize)
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

export { HeapChannelManager }