import { HeapFloat32Array } from './HeapFloat32Array'
import * as createModule from '../../wasm/build/rubberband.js'
import { RubberBandModule } from './RubberBandModule'

function isEqual(a: number, b: number, tolerance: number = Number.EPSILON): boolean {
  return Math.abs(a - b) < tolerance
}

describe('HeapFloat32Array', () => {
  let module: RubberBandModule

  beforeAll(async () => {
    module = await createModule()
  })

  it('Can exchange large arrays', () => {
    const factor = 2
    const kernel = new module.Test(factor)
    kernel.setUlp(1)
    console.info(kernel.getUlp())

    // Generate test array of size of buffer
    const size = 7319808
    const arr = new Float32Array(size)
    for (let i = 0; i < size; ++i) {
      arr[i] = ((i / size) * factor) - (factor / 2)
    }

    // Create heap
    const heap = new HeapFloat32Array(module, size)

    // Put test array into heap
    heap.write(arr)

    // Push array into test
    if (!kernel.push(heap.ptr, heap.size)) {
      throw new Error('Test was not successful')
    }

    // Also test receiving
    heap.write(new Float32Array(size))
    kernel.pull(heap.ptr, size)
    const result = heap.read()

    for (let i = 0; i < size; ++i) {
      const value = ((i / size) * factor) - (factor / 2)
      if (!isEqual(result[i], value, 0.0000001)) {
        throw new Error(`result[${i}] === ${result[i]} !== ${value} - pull did not deliver reliable data`)
      }
    }

    heap.close()

    console.info('Test succeeded')
  })
})