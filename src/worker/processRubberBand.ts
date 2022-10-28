import * as createModule from '../../wasm/build/rubberband.js'
import HeapArray from '../worklet/HeapArray'

let module: any | undefined

const processRubberBand = async ({
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
  if (module === undefined) {
    module = await createModule()
  }
  console.info(`Using processor with sampleRate=${sampleRate} channelCount=${channelCount} timeRatio=${timeRatio} and pitch=${pitch}`)
  const kernel = new module.RubberBandProcessor(sampleRate, channelCount, timeRatio, pitch)

  const inputSize = input[0].length
  //console.log(`input[0].length = ${input[0].length} input[0].byteLength = ${input[0].byteLength} Float32Array.BYTES_PER_ELEMENT = ${Float32Array.BYTES_PER_ELEMENT}`)
  //console.log(`${input[0].length} === ${input[0].byteLength / Float32Array.BYTES_PER_ELEMENT} ?`)
  const outputSize = kernel.getOutputSize(inputSize) as number
  console.info(`Input size: ${inputSize} Output size: ${outputSize}`)

  const inputArray = new HeapArray(module, inputSize / channelCount, channelCount)
  const outputArray = new HeapArray(module, outputSize / channelCount, channelCount)

  // Let inputArray point to input (of type Float32Array)
  for (let channel = 0; channel < channelCount; ++channel) {
    console.info(`Length of received input channel ${channel} buffer: ${input[channel].byteLength} (should be ${inputSize * Float32Array.BYTES_PER_ELEMENT})`)
    console.log("input[channel]", input[channel])
    console.log("input[channel][0]", input[channel][0])
    //inputArray.getChannelArray(channel).set(input[channel])
    for(let i = 0; i < 500; i++) {
      inputArray.getChannelArray(channel)[i] = input[channel][i];
    }
  }

  console.info("Start processing")
  kernel.process(inputArray.getHeapAddress(), inputSize, outputArray.getHeapAddress(), true);
  console.info("Finished processing")

  // Now feed new Float32Array with content of outputArray
  const output: Float32Array[] = []
  for (let channel = 0; channel < channelCount; ++channel) {
    output.push(new Float32Array(
      outputArray.getChannelArray(channel)
    ));
  }
  return output
}

export { processRubberBand }