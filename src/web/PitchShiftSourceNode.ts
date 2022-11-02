interface PitchShiftSourceNode extends AudioScheduledSourceNode {
    setBuffer(buffer: AudioBuffer): void;
    setPitch(pitch: number): void;
    setTempo(tempo: number): void;
    close(): void;
}
export {PitchShiftSourceNode}