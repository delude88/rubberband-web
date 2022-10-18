interface RubberBandNode extends AudioWorkletNode {
    setPitch(pitch: number): void;
    setTempo(tempo: number): void;
    setHighQuality(enabled: boolean): void;
    close(): void;
}
export {RubberBandNode}