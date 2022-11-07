import { PitchShiftSource } from './PitchShiftSource'
import { RubberBandAPI, RubberBandModule } from './RubberBandModule'
import { HeapAudioBuffer } from './HeapAudioBuffer'
import HeapArray from './HeapArray'

const RENDER_QUANTUM_FRAMES = 128

class RubberBandSource implements PitchShiftSource {
  private readonly module: RubberBandModule
  private readonly frameSize: number
  private pitchScale: number = 1
  private timeRatio: number = 1
  private kernel?: RubberBandAPI
  private buffer?: Float32Array[]
  private result?: Float32Array[]
  private inputArray?: HeapAudioBuffer
  private outputArray?: HeapAudioBuffer
  private processCounter: number = 0
  private outputWriteCounter: number = 0
  private outputReadCounter: number = 0

  constructor(module: RubberBandModule, frameSize: number = RENDER_QUANTUM_FRAMES) {
    this.module = module
    this.frameSize = frameSize
    //this.test(module)
  }

  private test(module: RubberBandModule) {
    const USE_BOTH = true
    const USE_AUDIO_BUFFER = true
    const USE_HEAP_ARRAY = true
    const size = 29279232

    const firstPtr = module._malloc(size * Float32Array.BYTES_PER_ELEMENT);
    const secondPtr = module._malloc(size * Float32Array.BYTES_PER_ELEMENT);
    const arr = new Float32Array(size)
    for(let i = 0; i < size; ++i) {
      arr[i] = i + 0.1
    }
    const firstArr = new Uint8Array(module.HEAPU8.buffer, firstPtr, size * Float32Array.BYTES_PER_ELEMENT)
    const secondArr = new Float32Array(module.HEAPF32.buffer, secondPtr, size)
    firstArr.set(new Uint8Array(arr.buffer), 0)
    secondArr.set(arr)
    console.log(arr, firstArr, secondArr)

    module._free(firstPtr)
    module._free(secondPtr)

    console.time("bufferTest")
    const input1 = new Float32Array(size)
    const input2 = new Float32Array(size)
    for(let i = 0; i < size; ++i) {
      input1[i] = i
      input2[i] = (i + 10)
    }
    console.log("input1", input1.subarray(0, 10))
    console.log("input2", input2.subarray(0, 10))
    if(USE_BOTH) {
      const heapAudioBuffer = new HeapAudioBuffer(module, size, 2)
      const heapArray = new HeapArray(module, size, 2)
      // TODO: Following says input1 is detacched?!? WTF?!?
      heapAudioBuffer.writeChannel(0, input1)
      heapAudioBuffer.writeChannel(1, input2)
      heapArray.getChannelArray(0).set(input1)
      heapArray.getChannelArray(1).set(input2)
      const output1 = heapAudioBuffer.readChannel(0)
      const output2 = heapAudioBuffer.readChannel(1)
      const output3 = heapArray.getChannelArray(0)
      const output4 = heapArray.getChannelArray(1)
      console.log("output1 (HeapAudioBuffer)", output1.subarray(0, 10))
      console.log("output2 (HeapAudioBuffer)", output2.subarray(0, 10))
      console.log("output3 (HeapArray)", output3.subarray(0, 10))
      console.log("output4 (HeapArray)", output4.subarray(0, 10))
      for (let i = 0; i < Math.min(100, size); i++) {
        console.assert(input1[i] === output1[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
        console.assert(input2[i] === output2[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
        console.assert(input1[i] === output3[i], `input1[${i}] === ${input1[i]} !== output3[${i}] === ${output3[i]}`)
        console.assert(input2[i] === output4[i], `input1[${i}] === ${input1[i]} !== output4[${i}] === ${output4[i]}`)
      }
      heapAudioBuffer.close()
      heapArray.close()
    } else if(USE_AUDIO_BUFFER) {
      const heapAudioBuffer = new HeapAudioBuffer(module, size, 2)
      heapAudioBuffer.writeChannel(0, input1)
      heapAudioBuffer.writeChannel(1, input2)
      const output1 = heapAudioBuffer.readChannel(0)
      const output2 = heapAudioBuffer.readChannel(1)
      console.log("output1 (HeapAudioBuffer)", output1.subarray(0, 10))
      console.log("output2 (HeapAudioBuffer)", output2.subarray(0, 10))
      for (let i = 0; i < Math.min(100, size); i++) {
        console.assert(input1[i] === output1[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
        console.assert(input2[i] === output2[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
      }
      heapAudioBuffer.close()
    } else if(USE_HEAP_ARRAY) {
      const heapArray = new HeapArray(module, size, 2)
      heapArray.getChannelArray(0).set(input1)
      heapArray.getChannelArray(1).set(input2)
      const output1 = heapArray.getChannelArray(0)
      const output2 = heapArray.getChannelArray(1)
      console.log("output1 (HeapArray)", output1.subarray(0, 10))
      console.log("output2 (HeapArray)", output2.subarray(0, 10))
      for (let i = 0; i < Math.min(100, size); i++) {
        console.assert(input1[i] === output1[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
        console.assert(input2[i] === output2[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
      }
      heapArray.close()
    }
    console.timeEnd("bufferTest")
  }

  private test2(module: RubberBandModule) {
    const size = 29279232
    console.time("bufferTest")
    const arr = new HeapAudioBuffer(module, size * 2, 2)
    const input1 = new Float32Array(size)
    const input2 = new Float32Array(size)
    console.log(size, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER)
    for(let i = 0; i < size; ++i) {
      input1[i] = i
      input2[i] = (i + 10)
    }
    arr.writeChannel(0, input1)
    arr.writeChannel(1, input2)
    const output1 = arr.readChannel(0)
    const output2 = arr.readChannel(1)
    console.log("input1", input1.slice(0, 10))
    console.log("input2", input2.subarray(0, 10))
    console.log("output1", output1.subarray(0, 10))
    console.log("output2", output2.subarray(0, 10))
    for (let i = 0; i < 6; i++) {
      console.assert(input1[i] === output1[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
      console.assert(input2[i] === output2[i], 'Same')
    }
    arr.close()
    console.timeEnd("bufferTest")
  }

  private fetch() {
    console.time("fetch")
    if (this.kernel && this.outputArray && this.buffer && this.result) {
      const channelCount = this.buffer.length
      let available = this.kernel.available()
      while (available > 0) {
        const actual = this.kernel.retrieve(this.outputArray.ptr, available)
        for (let c = 0; c < channelCount; ++c) {
          this.result[c].set(this.outputArray.readChannel(c))
        }
        this.outputWriteCounter += actual
        this.fetch()
        available = this.kernel.getSamplesRequired()
      }
    }
    console.timeEnd("fetch")
  }

  private process() {
    console.time("process")
    if (this.kernel && this.inputArray && this.buffer && this.buffer.length > 0) {
      const sampleSize = this.buffer[0].length
      let samples = this.kernel.getSamplesRequired()
      while (samples > 0) {
        this.kernel.process(this.inputArray.getOffsetPtr(this.processCounter), samples, this.processCounter + samples > sampleSize)
        this.processCounter += samples
        this.fetch()
        samples = this.kernel.getSamplesRequired()
      }
    }
    this.fetch()
    console.timeEnd("process")
  }

  private prepare(): void {
    if (this.buffer && this.buffer.length > 0) {
      this.inputArray?.close()
      this.outputArray?.close()

      const channelCount = this.buffer.length
      const sampleSize = this.buffer[0].length
      this.kernel = new this.module.RubberBandAPI(sampleRate, channelCount, this.timeRatio, this.pitchScale)

      this.inputArray = new HeapAudioBuffer(this.module, sampleSize, channelCount)
      this.outputArray = new HeapAudioBuffer(this.module, 8064, channelCount)

      for (let c = 0; c < channelCount; ++c) {
        this.inputArray.writeChannel(c, this.buffer[c])
      }

      console.log('Studying')
      this.kernel.study(this.inputArray.ptr, this.inputArray.size, true)
      console.log(`Studied ${channelCount} channels with ${this.inputArray.size} samples each`)

      this.process();
    }
  }

  pull(channels: Float32Array[]): void {
    if(channels.length > 0 && this.result && this.outputWriteCounter > this.outputReadCounter) {
      const channelCount = Math.min(channels.length, this.result.length)
      const length = Math.min(channels[0].length, this.outputWriteCounter - this.outputReadCounter)
      for (let c = 0; c < channelCount; ++c) {
        channels[c].set(this.result[c].subarray(this.outputReadCounter, this.outputReadCounter + length))
      }
    }
  }

  setBuffer(buffer: Float32Array[]): void {
    // Validate buffer
    if (buffer.length > 0) {
      for (let c = 0; c < buffer.length; ++c) {
        if (buffer[c].byteLength === 0) {
          throw new Error(`[PitchShiftSourceProcessor] setBuffer: buffer[${c}].byteLength === 0`)
        } else {
          console.log(`[PitchShiftSourceProcessor] setBuffer: buffer[${c}].byteLength === ${buffer[c].byteLength}`)
        }
      }
    }
    this.buffer = buffer
    this.prepare()
  }

  setPitchScale(pitchScale: number): void {
    console.log(`[PitchShiftMockup] Set pitch scale to ${pitchScale}`)
    this.pitchScale = pitchScale
    this.prepare()
  }

  setTimeRatio(timeRatio: number): void {
    console.log(`[PitchShiftMockup] Set time ratio to ${timeRatio}`)
    this.timeRatio = timeRatio
    this.prepare()
  }

  reset(): void {
    console.log(`[PitchShiftMockup] Reset`)
    this.prepare()
  }

  close(): void {
    console.log(`[PitchShiftMockup] Close`)
  }
}

export default RubberBandSource