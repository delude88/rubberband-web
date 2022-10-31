import {RubberBandRealtimeNode} from "./RubberBandRealtimeNode";

function createWorkletAsRubberNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): RubberBandRealtimeNode {
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
    return node as RubberBandRealtimeNode
}

async function createRubberBandRealtimeNode(
    context: BaseAudioContext,
    url: string,
    options?: AudioWorkletNodeOptions
): Promise<RubberBandRealtimeNode> {
    // ensure audioWorklet has been loaded
    try {
        return createWorkletAsRubberNode(context, options);
    } catch (err) {
        await context.audioWorklet.addModule(url)
        return createWorkletAsRubberNode(context, options);
    }
}

export {createRubberBandRealtimeNode}