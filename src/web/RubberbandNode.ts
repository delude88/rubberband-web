interface RubberBandNode extends AudioWorkletNode {
    setPitch(pitch: number): void;
    setTempo(pitch: number): void;
    setHighQuality(pitch: number): void;
    close(): void;
}
export {RubberBandNode}