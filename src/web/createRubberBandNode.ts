import {RubberBandNode} from "./RubberbandNode";

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandNode {
    const node = new AudioWorkletNode(context, "rubberband-processor", options) as any
    node.setPitch = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["pitch", pitch]));
    }
    node.setTempo = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["tempo", pitch]));
    }
    node.setHighQuality = (pitch: number) => {
        node.port.postMessage(JSON.stringify(["quality", pitch]));
    }
    node.close = () => {
        node.port.postMessage(JSON.stringify(["close"]));
    }
    return node as RubberBandNode
}

async function createRubberBandNode(
    context: BaseAudioContext,
    url: string,
    options?: AudioWorkletNodeOptions
): Promise<RubberBandNode> {
    // ensure audioWorklet has been loaded
    try {
        return createWorkletAsRubberNode(context, options);
    } catch (err) {
        await context.audioWorklet.addModule(url)
        return createWorkletAsRubberNode(context, options);
    }
}

export {createRubberBandNode}