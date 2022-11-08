class HeapStream<T extends ArrayBufferView> {
  private _ptr: number
  private readonly _data: T
  private _closed: boolean = false

  constructor(ptr: number, data: T) {
    this._ptr = ptr
    this._data = data
  }

  public close(): void {
    this._closed = true
  }

  public set ptr(ptr: number) {
    this._ptr = ptr
  }

  public get ptr(): number {
    if (this._closed) {
      throw new Error('Already closed')
    }
    return this._ptr
  }

  public get array(): T {
    if (this._closed) {
      throw new Error('Already closed')
    }
    return this._data
  }

  public get data(): T {
    return this.array
  }

  public get byteLength(): number {
    if (this._closed) {
      return 0
    }
    return this._data.byteLength
  }
}

class HeapChannelStream {
  private readonly _channels: HeapStream<Float32Array>[]

  constructor(manager: HeapManager, sampleCount: number, channelCount: number = 1) {
    if (sampleCount < 0) {
      throw new Error('Sample count has to be greater than 0')
    }
    if (channelCount < 0) {
      throw new Error('Channel count has to be greater than 0')
    }
    this._channels = []
    for (let c = 0; c < channelCount; ++c) {
      this._channels.push(manager.add(new Float32Array(sampleCount)))
    }
  }

  public get ptr(): number {
    return this._channels[0].ptr
  }

  public getChannel(index: number): Float32Array {
    return this.getChannelStream(index).data
  }

  public getChannelStream(index: number): HeapStream<Float32Array> {
    if (index < 0 || this._channels.length < index) {
      throw new Error('Out of bounce')
    }
    return this._channels[index]
  }
}

class HeapManager {
  private readonly _module: EmscriptenModule
  private _streams: HeapStream<ArrayBufferView>[] = []
  private _ptr?: number = 0

  constructor(module: EmscriptenModule) {
    this._module = module
  }

  public add<T extends ArrayBufferView>(array: T): HeapStream<T> {
    const stream = new HeapStream<T>(0, array)
    this._streams.push(stream)
    // Reallocate
    this.reallocate()
    return stream
  }

  public remove<T extends ArrayBufferView>(array: T): void {
    this._streams.filter((stream) => {
      if (stream.data === array) {
        stream.close()
        return false
      }
      return true
    })
    this.reallocate()
  }

  public get module(): EmscriptenModule {
    return this._module
  }

  public close(): void {
    this._streams.forEach((stream) => stream.close())
    if (this._ptr)
      this._module?._free(this._ptr)
  }

  private reallocate() {
    const byteSize = this._streams.reduce((prev, curr) => {
      return prev + curr.array.byteLength
    }, 0)
    if (this._ptr) {
      this._module._free(this._ptr)
    }
    this._ptr = this._module._malloc(byteSize)
    let currentPtr = this._ptr
    for (let i = 0; i < this._streams.length; ++i) {
      this._streams[i].ptr = currentPtr
      currentPtr += this._streams[i].data.byteLength
    }
  }
}

export { HeapManager, HeapChannelStream }