import {
  createPitchShiftSourceNode,
  createPitchShiftWorker,
  PitchShiftSourceNode
} from './../..'
import * as createModule from '../../wasm/build/rubberband.js'
import { HeapChannelStream, HeapManager } from './HeapManager.ts'
import { HeapArrayManager } from './HeapArrayManager.ts'

const audioContext = new AudioContext()
const worker = createPitchShiftWorker('../../public/pitch-shift.worker.js')

class Core {
  private source?: AudioBuffer
  private tempo: number = 1
  private playBuffer?: AudioBuffer
  private playNode?: AudioScheduledSourceNode
  private playing: boolean = false
  private useWorker: boolean = false
  public onLoaded?: () => void
  public onUnloaded?: () => void
  public onStarted?: () => void
  public onStopped?: () => void

  public get isPlaying(): boolean {
    return this.playing
  }

  stop = () => {
    console.info('stop')
    if (this.playNode) {
      this.playNode.stop()
      this.playNode.disconnect()
      this.playing = false
      if (this.onStopped) {
        this.onStopped()
      }
    }
  }

  restart = async () => {
    console.info('restart')
    if (this.playBuffer) {
      stop()
      if (this.useWorker) {
        const playNode = audioContext.createBufferSource()
        playNode.buffer = this.playBuffer
        this.playNode = playNode
      } else {
        const playNode = await createPitchShiftSourceNode(audioContext, '../../public/pitch-shift-source-processor.js')
        playNode.setBuffer(this.playBuffer)
        this.playNode = playNode
      }
      if (this.playNode) {
        this.playNode.connect(audioContext.destination)
        this.playNode.start()
        this.playing = true
        if (this.onStarted) {
          this.onStarted()
        }
      }
      return audioContext.resume()
    }
  }

  setPlayBuffer = async (audioBuffer: AudioBuffer) => {
    console.info('setPlayBuffer')
    this.playBuffer = audioBuffer
    if (this.onLoaded) {
      this.onLoaded()
    }
    if (this.playing) {
      await this.restart()
    }
  }

  setTempo = (tempo: number) => {
    console.info('setTempo')
    this.tempo = tempo
    if (this.useWorker) {
      if (this.source) {
        // (Re)process whole audio buffer
        worker.process(this.source, this.tempo)
          .then(audioBuffer => this.setPlayBuffer(audioBuffer))
      }
    } else {
      if (this.playNode) {
        // Just replace the audio buffer
        (this.playNode as PitchShiftSourceNode).setTempo(tempo)
      }
    }
  }

  setAudioBuffer = async (buffer?: AudioBuffer) => {
    console.info('setAudioBuffer')
    this.source = buffer
    if (this.source) {
      if (this.useWorker) {
        await worker.process(this.source, this.tempo)
          .then((audioBuffer) => this.setPlayBuffer(audioBuffer))
      } else {
        await this.setPlayBuffer(this.source)
      }
    } else {
      if (this.onUnloaded) {
        this.onUnloaded()
      }
    }
  }

  setWorkerEnabled = async (enabled: boolean) => {
    if (this.useWorker !== enabled) {
      this.useWorker = enabled
      await this.setAudioBuffer(this.source)
    }
  }
}

const useWorkerChooser = document.getElementById('worker') as HTMLInputElement
const fileChooser = document.getElementById('file') as HTMLInputElement
const playButton = document.getElementById('play') as HTMLButtonElement
const tempoChooser = document.getElementById('tempo') as HTMLInputElement

const core = new Core()

core.onStarted = () => {
  playButton.textContent = 'Stop'
}

core.onStopped = () => {
  playButton.textContent = 'Play'
}

core.onLoaded = () => {
  playButton.disabled = false
}

core.onUnloaded = () => {
  playButton.disabled = true
}

playButton.onclick = () => {
  if (core.isPlaying) {
    core.stop()
  } else {
    core.restart()
      .catch(err => console.error(err))
  }
}

useWorkerChooser.onchange = () => {
  core.setWorkerEnabled(useWorkerChooser.checked)
    .catch(err => console.error(err))
}

tempoChooser.onchange = () => {
  core.setTempo(Number.parseFloat(tempoChooser.value))
}

fileChooser.onchange = () => {
  if (fileChooser.files) {
    const file = fileChooser.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'object') {
        audioContext.decodeAudioData(event.target.result)
          .then(audioBuffer => core.setAudioBuffer(audioBuffer)
          )
          .catch(err => console.error(err))
      }
    }
    reader.readAsArrayBuffer(file)
  } else {
    playButton.disabled = true
  }
}

playButton.disabled = true


const runTest = (module: EmscriptenModule, size: number) => {
  console.log(`_malloc(${size * Float32Array.BYTES_PER_ELEMENT})`)
  const ptr = module._malloc(size * Float32Array.BYTES_PER_ELEMENT)
  const bla1 = new Uint8Array(module.HEAPU8.buffer, ptr, size * Float32Array.BYTES_PER_ELEMENT)
  console.log(bla1.byteLength)
  const bla2 = new Uint8Array(module.HEAPU8.buffer, ptr, size * Float32Array.BYTES_PER_ELEMENT)
  console.log(bla1.byteLength, bla2.byteLength)
  const bla3 = new Float32Array(module.HEAPF32.buffer, ptr, size)
  bla3[0] = 8.3
  bla3[1] = 1.4
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength)
  console.log('bla3[0]', bla3[0], 'bla3[1]', bla3[1])

  const bla3Copy = new Float32Array(bla3)
  console.log('bla3Copy[0]', bla3Copy[0], 'bla3Copy[1]', bla3Copy[1])

  console.log(`_malloc(${size * Float32Array.BYTES_PER_ELEMENT})`)
  const ptr2 = module._malloc(size * Float32Array.BYTES_PER_ELEMENT)
  const bla4 = new Uint8Array(module.HEAPU8.buffer, ptr2, size * Float32Array.BYTES_PER_ELEMENT)
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength, bla4.byteLength)
  console.log('bla3[0]', bla3[0], 'bla3[1]', bla3[1])
  console.log('bla3Copy[0]', bla3Copy[0], 'bla3Copy[1]', bla3Copy[1])
  const bla5 = new Float32Array(module.HEAPF32.buffer, ptr2, size)
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength, bla4.byteLength, bla5.byteLength)
  const bla6 = new Float32Array(module.HEAPF32.buffer, ptr2, size)
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength, bla4.byteLength, bla5.byteLength, bla6.byteLength)
  const bla7 = new Float32Array(module.HEAPF32.buffer, ptr2, size)
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength, bla4.byteLength, bla5.byteLength, bla6.byteLength, bla7.byteLength)
  console.log(`_free both`)
  module._free(ptr)
  module._free(ptr2)
  console.log(bla1.byteLength, bla2.byteLength, bla3.byteLength, bla4.byteLength, bla5.byteLength, bla6.byteLength, bla7.byteLength)
}

const testButton = document.getElementById('test') as HTMLButtonElement
testButton.onclick = async () => {
  const arr1 = new Float32Array([1, 2, 3, 4, 5, 6])
  const arr2 = new Float32Array(arr1.length)
  const arr3 = new Float32Array(arr1.buffer, 0)
  arr2.set(arr1)
  arr1[0] = 100
  arr1[1] = 100
  console.info('Changes to arr1 will affect arr3 but not arr1:')
  console.log(arr1)
  console.log(arr2)
  console.log(arr3)

  const arr4 = new Float32Array(10)
  arr4.set(arr1)
  console.log(arr4)
  const arr5 = new Float32Array(4)
  arr5.set(arr1.slice(0, arr5.length))
  console.log(arr5)

  WebAssembly.compileStreaming(fetch("simple.wasm"))
    .then((m) => {

    })
  const m = new WebAssembly.Module(0)

  const module: EmscriptenModule = await createModule()
  console.log(module)
  const size = 29279232

  console.info('Test with 120')
  runTest(module, 120)
  console.info(`Test with ${size}`)
  runTest(module, size)

  console.info('YOU SHOULD ALLOCATE MEMORY ONLY ONCE - or recreate all arrays again')

  // Test HeapChannelManager
  const manager = new HeapManager(module)
  const ch1 = new HeapChannelStream(manager, size,2)
  ch1.getChannel(0).set([9.9, 9.8, 9.7, 9.6, 9.5, 9.4, 9.3, 9.2, 9.1, 9.0])
  ch1.getChannel(1).set([1.1, 2.2, 3.3, 4.4])
  const ch2 = new HeapChannelStream(manager, size * 2, 3)
  ch2.getChannel(0).set([1.1, 2.2, 3.3, 4.4])
  ch2.getChannel(1).set([9.9, 9.8, 9.7, 9.6, 9.5, 9.4, 9.3, 9.2, 9.1, 9.0])
  new HeapChannelStream(manager, size,2)
  ch2.getChannel(2).set([1.1, 2.2, 3.3, 4.4])
  new HeapChannelStream(manager, size,2)
  ch1.data
  console.log(
    ch1.getChannel(0).length,
    ch1.getChannel(0)[0],
    ch1.getChannel(0)[1],
    ch1.getChannel(0)[2],
    ch1.getChannel(0)[3]
  )
  console.log(
    ch1.getChannel(1).length,
    ch1.getChannel(1)[0],
    ch1.getChannel(1)[1],
    ch1.getChannel(1)[2],
    ch1.getChannel(1)[3]
  )
  console.log(
    ch2.getChannel(0).length,
    ch2.getChannel(0)[0],
    ch2.getChannel(0)[1],
    ch2.getChannel(0)[2],
    ch2.getChannel(0)[3]
  )
  console.log(
    ch2.getChannel(1).length,
    ch2.getChannel(1)[0],
    ch2.getChannel(1)[1],
    ch2.getChannel(1)[2],
    ch2.getChannel(1)[3]
  )
  console.log(
    ch2.getChannel(2).length,
    ch2.getChannel(2)[0],
    ch2.getChannel(2)[1],
    ch2.getChannel(2)[2],
    ch2.getChannel(2)[3]
  )


  const arrayManager = new HeapArrayManager(module)
  arrayManager.create(size)
  arrayManager.create(size)
  arrayManager.create(size)
}