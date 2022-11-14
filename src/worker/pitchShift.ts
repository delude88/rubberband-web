import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from '../worklet/RubberBandModule'
import { DualHeapChannelManager } from '../wasm/HeapChannelManager'

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

  const inputSize = input[0].length
  const outputSize = Math.round(inputSize * timeRatio)
  console.info(`Input size: ${inputSize} Output size: ${outputSize}`)

  const manager = new DualHeapChannelManager(module, outputSize, channelCount)

  for (let channel = 0; channel < channelCount; ++channel) {
    console.info(`Set array of size ${input[channel].byteLength} to channel ${channel}`)
    manager.getInputChannel(channel).set(input[channel])
  }

  console.info('Study all samples at once')
  kernel.study(manager.getInputChannelPtr(), inputSize, true)

  let samplesRetrieved: number = 0
  const tryFetch = () => {
    let available = kernel.available()
    while (available > 0) {
      console.log(`Fetching next ${available} available samples`)
      kernel.retrieve(manager.getOutputChannelPtr(0, samplesRetrieved), available)
      samplesRetrieved += available
      available = kernel.available()
    }
  }

  let samplesProcessed: number = 0
  let samplesRequired: number = kernel.getSamplesRequired()
  while (samplesRequired > 0) {
    console.log(`Writing ${samplesRequired} samples`)
    kernel.process(manager.getInputChannelPtr(0, samplesProcessed), samplesRequired, samplesProcessed + samplesRetrieved >= inputSize)
    samplesProcessed += samplesRequired
    //tryFetch()
    samplesRequired = kernel.getSamplesRequired()
  }

  /*
  while (samplesRead <= outputSize) {
    tryFetch()
  }
   */
  console.info('Finished processing')

  return manager.getOutputChannels()
}

export { pitchShift }