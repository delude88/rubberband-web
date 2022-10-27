import { RubberbandWorker } from './RubberbandWorker'

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

const cloneArrayBuffer = (source: ArrayBuffer): ArrayBuffer => {
  const dest = new ArrayBuffer(source.byteLength)
  new Uint8Array(dest).set(new Uint8Array(source))
  return dest
}

const createRubberBandWorker = (url: string | URL, clone?: boolean): RubberbandWorker => {
  const worker = new Worker(url) as any
  worker.process = (audioBuffer: AudioBuffer, tempo: number, pitch: number = 1): Promise<AudioBuffer> => {
    return new Promise<AudioBuffer>((resolve, reject) => {
      // subscribe and transfer
      const onMessage = ({ data }: MessageEvent) => {
        worker.removeEventListener('message', onMessage)
        const { event } = data as Message
        if (event === 'process') {
          const { channels } = data as ProcessMessage
          const length = channels[0].byteLength / Float32Array.BYTES_PER_ELEMENT
          const processedAudioBuffer = new AudioBuffer({
            length: length, // <-- IMPORTANT
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate
          })
          for (let i = 0; i < channels.length; i++) {
            processedAudioBuffer.copyToChannel(new Float32Array(channels[i]), i)
          }
          resolve(processedAudioBuffer)
        } else if (event === 'error') {
          const { error } = data as ErrorMessage
          reject(new Error(error))
        } else {
          reject(new Error(`Unexpected event ${event}`))
        }
      }
      worker.addEventListener('message', onMessage)
      const transfer: ArrayBuffer[] = []
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const source = audioBuffer.getChannelData(channel).buffer
        transfer.push(cloneArrayBuffer(source))
      }
      worker.postMessage({
        event: 'process',
        pitch: pitch,
        tempo: tempo,
        channels: transfer
      } as ProcessMessage, transfer)
    })
  }
  return worker as RubberbandWorker
}

export { createRubberBandWorker }