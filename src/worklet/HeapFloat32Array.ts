class HeapFloat32Array {
  private readonly module_: EmscriptenModule
  private readonly size_: number
  private readonly data_: Uint8Array
  private readonly dataPtr_: number
  private readonly dataByteSize_: number
  private closed_: boolean = false

  constructor(module: EmscriptenModule, size: number) {
    this.module_ = module
    this.size_ = size
    this.dataByteSize_ = this.size * Float32Array.BYTES_PER_ELEMENT
    this.dataPtr_ = this.module_._malloc(this.dataByteSize_)
    this.data_ = new Uint8Array(this.module_.HEAPU8.buffer, this.dataPtr_, this.dataByteSize_)
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

  close(): void {
    this.module_._malloc(this.dataPtr_)
    this.closed_ = true
  }

  write(array: Float32Array) {
    if (this.closed) {
      throw new Error('Already closed')
    }
    this.data_.set(new Uint8Array(array.buffer))
  }

  read(array?: Float32Array): Float32Array {
    if (this.closed) {
      throw new Error('Already closed')
    }
    if (array) {
      array.set(this.data_)
      return array
    }
    return new Float32Array(this.data_.buffer, this.data_.byteOffset, this.size)
  }
}

export { HeapFloat32Array }