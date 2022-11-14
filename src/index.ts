import {
  createPitchShiftSourceNode,
  createPitchShiftWorker,
  PitchShiftSourceNode
} from './../..'
import * as createModule from '../../wasm/build/rubberband.js'

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
        const playNode = await createPitchShiftSourceNode(audioContext, '../../public/offline-pitch-shift-processor.js')
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
  const uint8ByteLength = size * Float32Array.BYTES_PER_ELEMENT;
  console.log(`_malloc(${size * Float32Array.BYTES_PER_ELEMENT})`)
  const ptr = module._malloc(size * Float32Array.BYTES_PER_ELEMENT)
  const bla1 = new Uint8Array(module.HEAPU8.buffer, ptr, uint8ByteLength)
  const bla2 = new Uint8Array(module.HEAPU8.buffer, ptr, uint8ByteLength)
  const bla3 = new Float32Array(module.HEAPF32.buffer, ptr, size)
  bla3[0] = 8.3
  bla3[1] = 1.4
  console.assert(bla1.byteLength === uint8ByteLength, `byteLength of bla1 = ${bla1.byteLength} === ${uint8ByteLength}`)
  console.log(`BEFORE 2nd _malloc(${size * Float32Array.BYTES_PER_ELEMENT})`, 'bla1.byteLength:', bla1.byteLength, 'bla2.byteLength:', bla2.byteLength, 'bla3.byteLength:', bla3.byteLength, 'bla3[0]:', bla3[0], 'bla3[1]:', bla3[1])

  // 2nd _malloc
  const ptr2 = module._malloc(size * Float32Array.BYTES_PER_ELEMENT)
  const bla4 = new Uint8Array(module.HEAPU8.buffer, ptr2, size * Float32Array.BYTES_PER_ELEMENT)
  const bla5 = new Float32Array(module.HEAPF32.buffer, ptr2, size)
  console.assert(bla1.byteLength === uint8ByteLength, `byteLength of bla1 = ${bla1.byteLength} === ${uint8ByteLength}`)
  console.log(`AFTER 2nd _malloc(${size * Float32Array.BYTES_PER_ELEMENT})`, 'bla1.byteLength:', bla1.byteLength, 'bla2.byteLength:', bla2.byteLength, 'bla3.byteLength:', bla3.byteLength, 'bla4.byteLength:', bla4.byteLength, 'bla5.byteLength:', bla5.byteLength, 'bla3[0]:', bla3[0], 'bla3[1]:', bla3[1])

  module._free(ptr)
  module._free(ptr2)
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

  // See https://playcode.io/1005840
  console.info('Loading wasm module')
  const module: EmscriptenModule = await createModule()
  console.log(module)
  const size = 29279232
  console.info('RUNNING TEST WITH 120 ENTRIES')
  runTest(module, 120)
  // Nearest for myself: 1434883 ... 1434884 is failing
  //const size2 = Math.round(module.HEAPF32.byteLength / 11.7)
  const size2 = Math.round(1024 * 1401 + 256 + 3) // 1434880
  console.info(`RUNNING TEST WITH ${size2} ENTRIES`)
  runTest(module, size2)
  console.info(`RUNNING TEST WITH ${size} ENTRIES`)
  runTest(module, size)

}