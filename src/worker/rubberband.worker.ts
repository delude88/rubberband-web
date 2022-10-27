/// <reference lib="webworker" />
import { PitchShifter } from '../worklet/PitchShifter'

const RENDER_QUANTUM_FRAMES = 1024

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
    // Recreate the array
    const inputChannels: Float32Array[] = []
    for (let i = 0; i < task.channels.length; i++) {
      inputChannels.push(new Float32Array(task.channels[i]))
    }
    console.log('Got channels', inputChannels)
    if (inputChannels.length === 0) {
      postMessage({ event: 'error', error: 'Received 0 channels' })
      return
    }
    // Create pitch shifter, register self for onReady
    new PitchShifter(task.sampleRate, task.channels.length, {
      numSamples: RENDER_QUANTUM_FRAMES,
      pitch: task.pitch,
      tempo: task.tempo,
      highQuality: true,
      onReady: (pitchShifter => {
        const length = inputChannels[0].length
        // Now process using rubber-band
        for (let start = 0; start < length; start += RENDER_QUANTUM_FRAMES) {
          pitchShifter.pushSlice(inputChannels, start, Math.min(length, start + RENDER_QUANTUM_FRAMES))
        }

        // Now fetch UNTIL we got all back


        pitchShifter.push(inputChannels)

        // Don't clone the array buffers, since we don't need them anymore
        const transfer: ArrayBuffer[] = []
        for (let i = 0; i < channels.length; i++) {
          transfer.push(channels[i].buffer)
        }
        postMessage({
          ...task,
          channels: transfer
        } as ProcessMessage, transfer)
      })
    })
  }

  // postMessage(JSON.stringify([event, payload]))
}