import { createRubberBandWorker } from './../..'

const audioContext = new AudioContext()
const worker = createRubberBandWorker('../../public/rubberband.worker.js')

const initUI = (fileChooser: HTMLInputElement, playButton: HTMLButtonElement, tempoChooser: HTMLInputElement) => {
  const context: {
    source?: AudioBuffer,
    tempo: number
    playBuffer?: AudioBuffer,
    playNode?: AudioBufferSourceNode
    playing: boolean,

  } = {
    tempo: 1,
    playing: false
  }


  const stop = () => {
    if (context.playNode) {
      context.playNode.stop()
      context.playNode.disconnect()
      context.playing = false
      playButton.textContent = 'Play'
    }
  }

  const restart = () => {
    if (context.playBuffer) {
      stop()
      context.playNode = audioContext.createBufferSource()
      context.playNode.connect(audioContext.destination)
      context.playNode.loop = true
      context.playNode.buffer = context.playBuffer
      context.playNode.start()
      context.playing = true
      playButton.textContent = 'Stop'
    }
  }

  const setPlayBuffer = (audioBuffer: AudioBuffer) => {
    context.playBuffer = audioBuffer
    if (context.playing) {
      restart()
    }
  }

  const handleAudioBufferOrTempoChange = () => {
    if (context.source) {
      //if (context.tempo !== 1) {
        // First pitch shift play buffer
        console.info(`Processing audio buffer with tempo ${context.tempo}`)
        worker.process(context.source, context.tempo)
          .then(audioBuffer => {
            console.info(`AudioBuffer length changed from ${context.source?.length} to ${audioBuffer.length} with tempo ${context.tempo * 100}%`)
            setPlayBuffer(audioBuffer)
            context.playBuffer = context.source
            if (context.playing) {
              restart()
            }
          })
      /*} else {
        console.info(`Skip processing audio buffer, since tempo is simply 1`)
        setPlayBuffer(context.source)
      }*/
    }
  }


  playButton.onclick = () => {
    void audioContext.resume()
    if (context.playing) {
      stop()
    } else {
      restart()
    }
  }

  tempoChooser.onchange = () => {
    context.tempo = Number.parseFloat(tempoChooser.value)
    handleAudioBufferOrTempoChange()
  }

  fileChooser.onchange = () => {
    if (fileChooser.files) {
      const file = fileChooser.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'object') {
          audioContext.decodeAudioData(event.target.result)
            .then(audioBuffer => {
              context.source = audioBuffer
              handleAudioBufferOrTempoChange()
              playButton.disabled = false
            })
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      playButton.disabled = true
    }
  }

  playButton.disabled = true
}


const fileChooser = document.getElementById('file') as HTMLInputElement
const playButton = document.getElementById('play') as HTMLButtonElement
const tempoChooser = document.getElementById('tempo') as HTMLInputElement

if (fileChooser && playButton) {
  initUI(fileChooser, playButton, tempoChooser)
}