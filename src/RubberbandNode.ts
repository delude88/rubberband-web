class RubberBandNode extends AudioWorkletNode {

  constructor(context: BaseAudioContext) {
    super(context, "rubberband-processor");
  }

  setPitch(pitch: number) {
    this.port.postMessage(JSON.stringify(["pitch", pitch]));
  }

  setTempo(tempo: number) {
    this.port.postMessage(JSON.stringify(["tempo", tempo]));
  }

  setHighQuality(enabled: boolean) {
    this.port.postMessage(JSON.stringify(["quality", enabled]));
  }

  close() {
    this.port.postMessage(JSON.stringify(["close"]));
  }
}

async function createRubberBandNode(
  context: BaseAudioContext,
  url: string
): Promise<RubberBandNode> {
  // ensure audioWorklet has been loaded
  try {
    return new RubberBandNode(context)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return new RubberBandNode(context)
  }
}


export {RubberBandNode, createRubberBandNode}