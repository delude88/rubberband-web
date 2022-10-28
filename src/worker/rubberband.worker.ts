/// <reference lib="webworker" />
import { processRubberBand } from './processRubberBand'

type Message = {
  event: 'process' | 'error' | string
}

type ProcessMessage = Message & {
  event: 'process',
  tempo: number,
  pitch: number,
  sampleRate: number,
  channels: Float32Array[]
}

type ErrorMessage = Message & {
  event: 'error',
  error: string
}


onmessage = ({ data }: MessageEvent) => {
  const { event } = data as Message

  if (event === 'process') {
    const task = data as ProcessMessage
    // TODO: Remove the following
    const inputChannels: Float32Array[] = []

    // Recreate the array
    for (let i = 0; i < task.channels.length; i++) {
      console.log(`task.channels[${i}].length = ${task.channels[i].length}`)
      inputChannels.push(new Float32Array(task.channels[i]))
      console.log(`inputChannels[${i}].length = ${task.channels[i].length}`)
    }
    if (inputChannels.length === 0) {
      postMessage({ event: 'error', error: 'Received 0 channels' })
      return
    }
    // Create pitch shifter, register self for onReady
    processRubberBand({
      input: inputChannels,
      pitch: task.pitch,
      timeRatio: task.tempo,
      sampleRate: task.sampleRate
    })
      .then((output) => {
        console.info('Got final result from rubber band processor')
        const transfer: ArrayBuffer[] = []
        for (let i = 0; i < output.length; i++) {
          transfer.push(output[i].buffer)
        }
        postMessage({
          ...task,
          channels: transfer
        } as ProcessMessage, transfer)
      })
      .catch(err => {
        postMessage({ event: 'error', error: err })
        console.error(err)
      })
  }

  // postMessage(JSON.stringify([event, payload]))
}