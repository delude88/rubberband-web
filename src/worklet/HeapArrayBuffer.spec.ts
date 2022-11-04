import { HeapFloat32Array } from './HeapFloat32Array'
import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from './RubberBandModule'
import { HeapAudioBuffer } from './HeapAudioBuffer'

describe('HeapFloat32Array', () => {
  let module: RubberBandModule

  beforeAll(async () => {
    module = await createModule()
  })

  it('Read equals write', () => {
    const arr = new HeapAudioBuffer(module, 6, 2)
    const input1 = new Float32Array([1, 2, 3, 4, 6, 7])
    const input2 = new Float32Array([8, 9, 10, 11, 12, 13])
    arr.writeChannel(0, input1)
    arr.writeChannel(1, input2)
    const output1 = arr.readChannel(0)
    const output2 = arr.readChannel(1)
    console.log("output1", output1)
    console.log("output2", output2)
    for (let i = 0; i < 6; i++) {
      console.assert(input1[i] === output1[i], `input1[${i}] === ${input1[i]} !== output1[${i}] === ${output1[i]}`)
      console.assert(input2[i] === output2[i], 'Same')
    }
    arr.close()
  })
})