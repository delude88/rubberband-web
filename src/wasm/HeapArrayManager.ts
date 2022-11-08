class HeapChannelStream {
  private readonly _channels: HeapArray[]

  constructor(manager: HeapArrayManager, sampleCount: number, channelCount: number = 1) {
    if (sampleCount < 0) {
      throw new Error('Sample count has to be greater than 0')
    }
    if (channelCount < 0) {
      throw new Error('Channel count has to be greater than 0')
    }
    this._channels = []
    for (let c = 0; c < channelCount; ++c) {
      this._channels.push(manager.create(sampleCount))
    }
    console.assert(this._channels.length, channelCount, "All channels have been created")
  }

  public get size(): number {
    return this._channels[0].array.length
  }

  public get ptr(): number {
    return this._channels[0].array.byteOffset
  }

  public getPtr(offset: number = 0): number {
    return this.ptr + offset * Float32Array.BYTES_PER_ELEMENT
  }

  public getChannel(index: number): Float32Array {
    return this.getChannelStream(index)
  }

  public getChannels(): Float32Array[] {
    return this._channels.map(channel => channel.array)
  }

  public getChannelPtr(index: number, offset: number = 0): number {
    return this.getChannelStream(index).byteOffset + offset * Float32Array.BYTES_PER_ELEMENT
  }

  public getChannelStream(index: number): Float32Array {
    if (index < 0 || this._channels.length < index) {
      throw new Error('Out of bounce')
    }
    return this._channels[index].array
  }
}

class HeapArray {
  private readonly _module: EmscriptenModule
  private readonly _size: number
  private _data: Float32Array
  private _backup?: Float32Array

  constructor(module: EmscriptenModule, size: number, ptr: number) {
    console.log(`HeapArray(${size >> Uint16Array.BYTES_PER_ELEMENT}, ${ptr}), ${module.HEAPF32.byteLength}`)
    this._module = module
    this._size = size
    this._data = this._module.HEAPF32.subarray(
      ptr >> Uint16Array.BYTES_PER_ELEMENT,
      (ptr + this._size * this._size * Float32Array.BYTES_PER_ELEMENT) >> Uint16Array.BYTES_PER_ELEMENT
    )
    //this._data = new Float32Array(this._module.HEAPF32.buffer, ptr >> Uint16Array.BYTES_PER_ELEMENT, this._size >> Uint16Array.BYTES_PER_ELEMENT)
  }

  public backup() {
    this._backup = new Float32Array(this._data) // clone
  }

  public restore(ptr?: number) {
    if (this._backup) {
      if (ptr && ptr !== this._data.byteOffset) {
        this._data = this._module.HEAPF32.subarray(
          ptr >> Uint16Array.BYTES_PER_ELEMENT,
          (ptr + this._size * this._size * Float32Array.BYTES_PER_ELEMENT) >> Uint16Array.BYTES_PER_ELEMENT
        )
        //this._data = new Float32Array(this._module.HEAPF32, ptr, this._size)
      }
      this._data.set(this._backup)
    }
  }

  public get ptr() {
    return this._data.byteOffset
  }

  public get array() {
    return this._data
  }
}

class HeapArrayManager {
  private readonly _module: EmscriptenModule
  private _arrays: HeapArray[] = []
  private _ptr?: number = 0

  constructor(module: EmscriptenModule) {
    this._module = module
  }

  public create(length: number): HeapArray {
    const byteLength = length * Float32Array.BYTES_PER_ELEMENT
    const ptr = this.reallocate(byteLength)
    const array = new HeapArray(this._module, length, ptr)
    this._arrays.push(array)
    return array
  }

  public get module(): EmscriptenModule {
    return this._module
  }

  public close(): void {
    if (this._ptr)
      this._module?._free(this._ptr)
  }

  private reallocate(additionalBytes: number = 0): number {
    let byteLength = 0
    this._arrays.forEach(array => {
      byteLength += array.array.byteLength
      array.backup()
    })
    if (this._ptr) {
      this._module._free(this._ptr)
    }
    this._ptr = this._module._malloc(byteLength + additionalBytes)
    let currentPtr = this._ptr
    for (let i = 0; i < this._arrays.length; ++i) {
      console.info(`[${i}]: ${this._arrays[i].array.byteLength}@${currentPtr}`)
      this._arrays[i].restore(currentPtr)
      currentPtr += this._arrays[i].array.byteLength
    }
    return currentPtr
  }
}

export { HeapArrayManager, HeapChannelStream }