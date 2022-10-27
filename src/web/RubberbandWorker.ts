interface RubberbandWorker extends AudioWorkletNode {
    process(audioBuffer: AudioBuffer, tempo: number, pitch?: number): Promise<AudioBuffer>
    close(): void;
}
export {RubberbandWorker}