import { createPitchShiftRealtimeNode, createPitchShiftSourceNode, createPitchShiftWorker, PitchShiftSourceNode } from './../..'

const audioContext = new AudioContext()
const worker = createPitchShiftWorker('../../public/rubberband.worker.js')

const initUI = (useWorkerChooser: HTMLInputElement, fileChooser: HTMLInputElement, playButton: HTMLButtonElement, tempoChooser: HTMLInputElement) => {
  const context: {
    source?: AudioBuffer,
    tempo: number
    playBuffer?: AudioBuffer,
    playNode?: AudioScheduledSourceNode
    playing: boolean
    useWorker: boolean
  } = {
    tempo: 1,
    playing: false,
    useWorker: false
  }

  const stop = () => {
    console.info("stop")
    if (context.playNode) {
      context.playNode.stop()
      context.playNode.disconnect()
      context.playing = false
      playButton.textContent = 'Play'
    }
  }

  const restart = async () => {
    console.info("restart")
    if (context.playBuffer) {
      stop()
      if (context.useWorker) {
        const playNode = audioContext.createBufferSource()
        playNode.buffer = context.playBuffer
        context.playNode = playNode
      } else {
        const playNode = await createPitchShiftSourceNode(audioContext, '../../public/rubberband-source-processor.js')
        playNode.setBuffer(context.playBuffer)
        context.playNode = playNode
      }
      if (context.playNode) {
        context.playNode.connect(audioContext.destination)
        context.playNode.start()
        context.playing = true
        playButton.textContent = 'Stop'
      }
    }
  }

  const setPlayBuffer = (audioBuffer: AudioBuffer) => {
    console.info("setPlayBuffer")
    context.playBuffer = audioBuffer
    if (context.playing) {
      restart()
    }
  }

  const setTempo = (tempo: number) => {
    console.info("setTempo")
    context.tempo = tempo
    if (context.useWorker) {
      if (context.source) {
        // (Re)process whole audio buffer
        worker.process(context.source, context.tempo)
          .then(audioBuffer => {
            console.info(`AudioBuffer length changed from ${context.source?.length} to ${audioBuffer.length} with tempo ${context.tempo * 100}%`)
            setPlayBuffer(audioBuffer)
          })
      }
    } else {
      if(context.playNode) {
        // Just replace the audio buffer
        (context.playNode as PitchShiftSourceNode).setTempo(tempo)
      }
    }
  }

  const setAudioBuffer = async (buffer?: AudioBuffer) => {
    console.info("setAudioBuffer")
    context.source = buffer
    if (context.source) {
      if (context.useWorker) {
        await worker.process(context.source, context.tempo)
          .then(audioBuffer => {
            console.info(`AudioBuffer length changed from ${context.source?.length} to ${audioBuffer.length} with tempo ${context.tempo * 100}%`)
            setPlayBuffer(audioBuffer)
          })
      } else {
        setPlayBuffer(context.source)
      }
      playButton.disabled = false
    } else {
      playButton.disabled = true
    }
  }

  const setWorkerEnabled = async (enabled: boolean) => {
    if (context.useWorker !== enabled) {
      context.useWorker = enabled
      await setAudioBuffer(context.source)
    }
  }

  playButton.onclick = () => {
    void audioContext.resume()
    if (context.playing) {
      stop()
    } else {
      restart()
        .catch(err => console.error(err))
    }
  }



  useWorkerChooser.onchange = () => {
    setWorkerEnabled(useWorkerChooser.checked)
      .catch(err => console.error(err))
  }

  tempoChooser.onchange = () => {
    setTempo(Number.parseFloat(tempoChooser.value))
  }

  fileChooser.onchange = () => {
    if (fileChooser.files) {
      const file = fileChooser.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'object') {
          audioContext.decodeAudioData(event.target.result)
            .then(audioBuffer => setAudioBuffer(audioBuffer)
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
}


const useWorkerChooser = document.getElementById('worker') as HTMLInputElement
const fileChooser = document.getElementById('file') as HTMLInputElement
const playButton = document.getElementById('play') as HTMLButtonElement
const tempoChooser = document.getElementById('tempo') as HTMLInputElement

if (fileChooser && playButton) {
  initUI(useWorkerChooser, fileChooser, playButton, tempoChooser)
}