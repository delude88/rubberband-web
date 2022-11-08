import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from '../worklet/RubberBandModule'
import { HeapChannelStream, HeapArrayManager } from '../wasm/HeapArrayManager'

let module: RubberBandModule | undefined

const pitchShift = async ({
                            input,
                            sampleRate,
                            timeRatio,
                            pitch = 1
                          }: {
  input: Float32Array[],
  sampleRate: number,
  timeRatio: number,
  pitch?: number
}): Promise<Float32Array[]> => {
  const channelCount = input.length
  if (channelCount === 0) {
    return input
  }
  if (!module) {
    module = await createModule()
  }
  if (!module) {
    throw new Error('Could not assign module')
  }
  console.info(`Using processor with sampleRate=${sampleRate} channelCount=${channelCount} timeRatio=${timeRatio} and pitch=${pitch}`)
  const kernel = new module.RubberBandAPI(sampleRate, channelCount, timeRatio, pitch)
  const memory = new HeapArrayManager(module)

  const inputSize = input[0].length
  const outputSize = Math.round(inputSize * timeRatio)
  console.info(`Input size: ${inputSize} Output size: ${outputSize}`)

  const inputArray = new HeapChannelStream(memory, inputSize, channelCount)
  const inputBuffer = new HeapChannelStream(memory, 8192, channelCount)
  const outputBuffer = new HeapChannelStream(memory, 8192, channelCount)
  const outputArray = new HeapChannelStream(memory, outputSize, channelCount)
  for (let channel = 0; channel < channelCount; ++channel) {
    console.info(`Set array of size ${input[channel].byteLength} to channel ${channel}`)
    inputArray.getChannel(channel).set(input[channel])
  }

  console.info('Study all samples at once')
  kernel.study(inputArray.ptr, inputSize, true)

  let samplesRead: number = 0
  const tryFetch = () => {
    let available = kernel.available()
    while (available > 0) {
      console.log(`Fetching next ${available} available samples`)
      kernel.retrieve(outputBuffer.ptr, available)
      for (let channel = 0; channel < channelCount; ++channel) {
        outputArray.getChannel(channel).set(outputBuffer.getChannel(channel).slice(0, available), samplesRead)
      }
      samplesRead += available
      available = kernel.available()
    }
  }

  let samplesWritten: number = 0
  let samplesRequired: number = kernel.getSamplesRequired()
  while (samplesRequired > 0) {
    console.log(`Writing ${samplesRequired} samples`)
    for (let channel = 0; channel < channelCount; ++channel) {
      const inputChannel = inputArray.getChannel(channel)
      console.log(`InputChannel has size ${inputChannel.byteLength}`)
      inputBuffer.getChannel(channel).set(input[channel].slice(samplesWritten, samplesRequired))
    }
    samplesWritten += samplesRequired
    kernel.process(inputBuffer.ptr, samplesRequired, samplesWritten >= inputSize)
    //tryFetch()
    samplesRequired = kernel.getSamplesRequired()
  }

  /*
  while (samplesRead <= outputSize) {
    tryFetch()
  }
   */
  console.info('Finished processing')

  return outputArray.getChannels()
}

export { pitchShift }