import * as createModule from '../../wasm/build/rubberband.js'
import HeapArray from '../worklet/HeapArray'
import { RubberBandModule } from '../worklet/RubberBandModule'

let module: RubberBandModule | undefined

const pitchShift2 = async ({
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

  const inputArray = new HeapArray(module, inputSize, channelCount)
  for (let channel = 0; channel < channelCount; ++channel) {
    console.info(`Set array of size ${input[channel].byteLength} to channel ${channel}`)
    inputArray.getChannelArray(channel).set(input[channel])
  }

  console.info('Study all samples at once')
  kernel.study(inputArray.getHeapAddress(), inputSize, true)

  const outputArray = new HeapArray(module, outputSize, channelCount)
  const inputBuffer = new HeapArray(module, 16384, channelCount)
  const outputBuffer = new HeapArray(module, 16384, channelCount)

  let samplesRead: number = 0
  const tryFetch = () => {
    let available = kernel.available()
    while (available > 0) {
      console.log(`Fetching next ${available} available samples`)
      kernel.retrieve(outputBuffer.getHeapAddress(), available)
      for (let channel = 0; channel < channelCount; ++channel) {
        outputArray.getChannelArray(channel).set(outputBuffer.getChannelArray(channel).slice(0, available), samplesRead)
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
      const inputChannel = inputArray.getChannelArray(channel)
      console.log(`InputChannel has size ${inputChannel.byteLength}`)
      inputBuffer.getChannelArray(channel).set(input[channel].slice(samplesWritten, samplesRequired))
    }
    samplesWritten += samplesRequired
    kernel.process(inputBuffer.getHeapAddress(), samplesRequired, samplesWritten >= inputSize)
    tryFetch()
    samplesRequired = kernel.getSamplesRequired()
  }
  //while (samplesRead <= outputSize) {
    tryFetch()
  //}
  console.info('Finished processing')

  return outputArray.getArray()
}

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
  const kernel = new module.RubberBandProcessor(sampleRate, channelCount, timeRatio, pitch)

  const inputSize = input[0].length

  const inputArray = new HeapArray(module, inputSize, channelCount)
  for (let channel = 0; channel < channelCount; ++channel) {
    inputArray.getChannelArray(channel).set(input[channel])
  }

  console.info('Start processing')
  const outputSize = kernel.setBuffer(inputArray.getHeapAddress(), inputSize)
  console.info('Finished processing')

  const outputArray = new HeapArray(module, outputSize, channelCount)

  console.info(`Input size: ${inputSize} Output size: ${outputSize}`)

  kernel.retrieve(outputArray.getHeapAddress(), outputSize)

  return outputArray.getArray()
}

export { pitchShift }