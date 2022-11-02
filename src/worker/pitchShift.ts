import * as createModule from '../../wasm/build/rubberband.js'
import HeapArray from '../worklet/HeapArray'
import { RubberBandModule } from '../worklet/RubberBandModule'

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