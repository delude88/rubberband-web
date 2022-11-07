const USE_MEMORY = false

class HeapAudioBuffer {
  private readonly module_: EmscriptenModule
  private readonly size_: number
  private readonly data_: Float32Array
  private readonly dataPtr_: number
  private readonly dataByteSize_: number
  private readonly channelByteSize_: number
  private readonly channelCount_: number
  private closed_: boolean = false

  constructor(module: EmscriptenModule, size: number, channelCount: number = 1) {
    this.module_ = module
    this.size_ = size
    this.channelCount_ = channelCount
    this.channelByteSize_ = this.size_ * Float32Array.BYTES_PER_ELEMENT
    this.dataByteSize_ = this.channelCount_ * this.channelByteSize_

    this.dataPtr_ = this.module_._malloc(this.dataByteSize_)
    this.data_ = new Float32Array(this.module_.HEAPF32.buffer, this.dataPtr_, this.size_ * this.channelCount_)

    console.log(`[HeapAudioBuffer] Created buffer at ${this.dataPtr_} of size ${this.data_.length} (internal: ${this.data_.byteLength}), ending at ${this.dataPtr_ + this.dataByteSize_}`)
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

  public writeChannel = (channel: number, array: Float32Array) => {
    if (this.closed) {
      throw new Error('Already closed')
    }
    console.log(`[HeapAudioBuffer] Writing to buffer with byteLength = ${this.data_.byteLength} (should be ${this.dataByteSize_})`)
    if (channel > this.channelCount_) {
      throw new Error('Cannot write channel: channel is out of bounce')
    }
    if (array.length > this.size_) {
      throw new Error('Cannot write channel: it is larger than this audio buffer')
    }
    if (this.data_.byteLength === 0) {
      throw new Error('Internal data array is detached')
    }
    if (array.byteLength === 0) {
      throw new Error('Incoming array is detached (its byteLength = 0)')
    }

    this.data_.set(array, channel * this.size_)
  }

  /**
   * @param channel
   * @param array may slow down when specified, prefer using the returned array
   */
  public readChannel = (channel: number, array?: Float32Array): Float32Array => {
    if (this.closed) {
      throw new Error('Already closed')
    }
    if (channel > this.channelCount_) {
      throw new Error('Cannot write channel: channel is out of bounce')
    }
    const start = channel * this.size_;
    const end = start +  this.size_;
    if (!array) {
      return this.data_.subarray(start, end)
    }
    array.set(this.data_.subarray(start, end))
    return array
  }

  public getOffsetPtr(position: number): number {
    if (position < 0 || position > this.size_) {
      throw new Error('Position is out of scope')
    }
    return this.dataPtr_ + position * Float32Array.BYTES_PER_ELEMENT
  }
}

export { HeapAudioBuffer }