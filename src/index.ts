import {
  createPitchShiftSourceNode,
  createPitchShiftWorker,
  PitchShiftSourceNode
} from './../..'

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
    if(this.onLoaded) {
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
          .then(audioBuffer => this.setPlayBuffer(audioBuffer))
      } else {
        await this.setPlayBuffer(this.source)
      }
    } else {
      if(this.onUnloaded) {
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
  playButton.textContent = "Stop"
}

core.onStopped = () => {
  playButton.textContent = "Play"
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