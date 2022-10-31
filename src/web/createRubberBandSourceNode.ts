import { RubberBandNode } from './RubberbandNode'

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandNode {
  const node = new AudioWorkletNode(context, 'rubberband-source-processor', options) as any
  node.setBuffer = (buffer: Float32Array[]) => {
    node.port.postMessage({
      event: 'buffer',
      buffer: buffer
    }, buffer)
  }
  node.setPitch = (pitch: number) => {
    node.port.postMessage({
      event: 'pitch',
      pitch: pitch
    })
  }
  node.setTempo = (tempo: number) => {
    node.port.postMessage({
      event: 'tempo',
      tempo: tempo
    })
  }
  node.setHighQuality = (enabled: boolean) => {
    node.port.postMessage({
      event: 'quality',
      quality: enabled
    })
  }
  node.close = () => {
    node.port.postMessage({
      event: 'close'
    })
  }
  return node as RubberBandNode
}

async function createRubberBandSourceNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandNode> {
  // ensure audioWorklet has been loaded
  try {
    return createWorkletAsRubberNode(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createWorkletAsRubberNode(context, options)
  }
}

export { createRubberBandSourceNode }