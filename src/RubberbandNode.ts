class RubberbandNode extends AudioWorkletNode {

  constructor(context) {
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

async function createRubberbandNode(
  context: BaseAudioContext,
  url: string
): Promise<RubberbandNode> {
  // ensure audioWorklet has been loaded
  try {
    return new RubberbandNode(context)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return new RubberbandNode(context)
  }
}

export {RubberbandNode, createRubberbandNode}