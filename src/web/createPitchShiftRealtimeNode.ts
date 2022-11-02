import {PitchShiftRealtimeNode} from "./PitchShiftRealtimeNode";

function createWorkletAsRealtimeNode(context: BaseAudioContext, options?: AudioWorkletNodeOptions): PitchShiftRealtimeNode {
    const node = new AudioWorkletNode(context, "pitch-shift-realtime-processor", options) as any
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
    return node as PitchShiftRealtimeNode
}

async function createPitchShiftRealtimeNode(
    context: BaseAudioContext,
    url: string,
    options?: AudioWorkletNodeOptions
): Promise<PitchShiftRealtimeNode> {
    // ensure audioWorklet has been loaded
    try {
        return createWorkletAsRealtimeNode(context, options);
    } catch (err) {
        await context.audioWorklet.addModule(url)
        return createWorkletAsRealtimeNode(context, options);
    }
}

export {createPitchShiftRealtimeNode}