import { RubberBandSourceNode } from './RubberBandSourceNode'

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandSourceNode {
  const node = new AudioWorkletNode(context, 'rubberband-source-processor', options) as any
  node.setBuffer = (buffer: AudioBuffer) => {
    const transfer: ArrayBuffer[] = []
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const source = buffer.getChannelData(channel).buffer
      transfer.push(source)
    }
    node.port.postMessage({
      event: 'buffer',
      buffer: transfer
    }, transfer)
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
  let startTimeout: any
  node.start = (when?: number) => {
    if(startTimeout) {
      clearTimeout(startTimeout)
    }
    if(!when || when <= context.currentTime) {
      node.port.postMessage({
        event: 'start'
      })
    } else {
      startTimeout = setTimeout(() => {
        node.port.postMessage({
          event: 'start'
        })
      }, (context.currentTime - when) * 1000)
    }
  }
  let stopTimeout: any
  node.stop = (when?: number) => {
    if(stopTimeout) {
      clearTimeout(stopTimeout)
    }
    if(!when || when <= context.currentTime) {
      node.port.postMessage({
        event: 'stop'
      })
    } else {
      stopTimeout = setTimeout(() => {
        node.port.postMessage({
          event: 'stop'
        })
      }, (context.currentTime - when) * 1000)
    }
  }
  node.setPitch = (pitch: number) => {
    node.port.postMessage({
      event: 'pitch',
      pitch: pitch
    })
  }
  node.close = () => {
    node.port.postMessage({
      event: 'close'
    })
  }
  console.info("Created RubberBandSourceNode")
  return node as RubberBandSourceNode
}

async function createRubberBandSourceNode(
  context: BaseAudioContext,
  url: string,
  options?: AudioWorkletNodeOptions
): Promise<RubberBandSourceNode> {
  // ensure audioWorklet has been loaded
  try {
    return createWorkletAsRubberNode(context, options)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return createWorkletAsRubberNode(context, options)
  }
}

export { createRubberBandSourceNode }