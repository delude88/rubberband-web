import * as Tone from 'tone'
import { RubberBandNode } from './RubberbandNode'

const createWorkletAsRubberToneJSNode = async (): Promise<RubberBandNode> => {
  const node = Tone.context.createAudioWorkletNode('rubberband-processor')
  const enhancement = {
    setPitch(pitch: number) {
      node.port.postMessage(JSON.stringify(['pitch', pitch]))
    },
    setTempo(tempo: number) {
      node.port.postMessage(JSON.stringify(['tempo', tempo]))
    },
    setHighQuality(enabled: boolean) {
      node.port.postMessage(JSON.stringify(['quality', enabled]))
    },
    close() {
      node.port.postMessage(JSON.stringify(['close']))
    },
  }
  return Object.assign(node, enhancement)
}

const createRubberBandNodeForToneJS = async (
  url: string
): Promise<RubberBandNode> => {
  try {
    return await createWorkletAsRubberToneJSNode()
  } catch (err) {
    await Tone.context.addAudioWorkletModule(url, 'rubberband-processor')
    return await createWorkletAsRubberToneJSNode()
  }
}

export { createRubberBandNodeForToneJS }
