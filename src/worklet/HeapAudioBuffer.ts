class HeapAudioBuffer {
  private readonly module_: EmscriptenModule
  private readonly size_: number
  private readonly data_: Uint8Array
  private readonly dataPtr_: number
  private readonly dataByteSize_: number
  private readonly channelByteSize_: number
  private readonly channelCount_: number
  private closed_: boolean = false

  constructor(module: EmscriptenModule, size: number, channelCount: number = 1) {
    this.module_ = module
    this.size_ = size
    this.channelCount_ = channelCount
    this.channelByteSize_ = this.size * Float32Array.BYTES_PER_ELEMENT
    this.dataByteSize_ = this.channelCount_ * this.channelByteSize_
    this.dataPtr_ = this.module_._malloc(this.dataByteSize_)
    this.data_ = new Uint8Array(this.module_.HEAPU8.buffer, this.dataPtr_, this.dataByteSize_)
  }

  public get channelCount(): number {
    return this.channelCount_
  }

  public get size(): number {
    return this.size_
  }

  public get ptr(): number {
    if (this.closed) {
      throw new Error('Already closed')
    }
    return this.dataPtr_
  }

  public get address(): number {
    return this.ptr
  }

  public get closed(): boolean {
    return this.closed_
  }

  public close(): void {
    this.module_._malloc(this.dataPtr_)
    this.closed_ = true
  }

  public writeChannel(channel: number, array: Float32Array) {
    if (this.closed) {
      throw new Error('Already closed')
    }
    if (channel > this.channelCount_) {
      throw new Error('Cannot write channel: channel is out of bounce')
    }
    if (array.length > this.size_) {
      throw new Error('Cannot write channel: it is larger than this audio buffer')
    }
    this.data_.set(new Uint8Array(array.buffer), this.channelByteSize_ * channel)
  }

  /**
   * @param channel
   * @param array may slow down when specified, prefer using the returned array
   */
  public readChannel(channel: number, array?: Float32Array): Float32Array {
    if (this.closed) {
      throw new Error('Already closed')
    }
    if (channel > this.channelCount_) {
      throw new Error('Cannot write channel: channel is out of bounce')
    }
    const offset = this.data_.byteOffset + channel * this.channelByteSize_
    if (!array) {
      return new Float32Array(this.data_.buffer, offset, this.size)
    }
    array.set(new Float32Array(this.data_.buffer, offset, this.size))
    return array
  }

  public getOffsetPtr(position: number): number {
    if(position < 0 || position > this.size_) {
      throw new Error("Position is out of scope")
    }
    return this.dataPtr_ + position * Float32Array.BYTES_PER_ELEMENT
  }
}

export { HeapAudioBuffer }