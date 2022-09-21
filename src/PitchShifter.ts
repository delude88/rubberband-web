import Module from "./rubberband.wasmmodule.js";
import HeapArray from "./HeapArray.js";

const RENDER_QUANTUM_FRAMES = 128;

interface PitchShifterOptions {
    highQuality?: boolean,
    numSamples?: number,
    pitch?: number,
    tempo?: number
}

class PitchShifter {
    private readonly instance: any;
    private readonly channelCount: number;
    private readonly numSamples: number;
    private readonly highQuality: boolean;
    private inputArray: HeapArray;
    private outputArray: HeapArray;

    public constructor(sampleRate: number, channelCount: number, options?: PitchShifterOptions) {
        this.numSamples = options?.numSamples || RENDER_QUANTUM_FRAMES
        this.channelCount = channelCount
        this.highQuality = options?.highQuality
        this.instance = new Module.PitchShifter(sampleRate, channelCount, this.highQuality);
        this.inputArray = new HeapArray(Module, RENDER_QUANTUM_FRAMES, channelCount);
        this.outputArray = new HeapArray(Module, RENDER_QUANTUM_FRAMES, channelCount);
        options?.pitch && this.setPitch(options.pitch)
        options?.tempo && this.setTempo(options.tempo)
    }

    public setTempo(tempo: number) {
        this.instance.setTempo(tempo)
    }

    public setPitch(pitch: number) {
        this.instance.setPitch(pitch)
    }

    public get samplesAvailable(): number {
        return this.instance.getSamplesAvailable()
    }

    public push(channels: Float32Array[]) {
        const channelCount = channels.length
        if (channelCount > 0) {
            for (let channel = 0; channel < channels.length; ++channel) {
                this.inputArray.getChannelArray(channel).set(channels[channel]);
            }
            this.instance.push(this.inputArray.getHeapAddress(), this.numSamples)
        }
    }

    public pull(channels: Float32Array[]): Float32Array[] {
        const channelCount = channels.length
        if (channelCount > 0) {
            const available = this.instance.getSamplesAvailable();
            if (available >= this.numSamples) {
                this.instance.pull(this.outputArray.getHeapAddress(), this.numSamples);
                for (let channel = 0; channel < channels.length; ++channel) {
                    channels[channel].set(this.outputArray.getChannelArray(channel));
                }
            }
        }
        return channels
    }

    public getVersion(): number {
        return this.instance.getVersion()
    }

    public getChannelCount(): number {
        return this.channelCount
    }

    public isHighQuality(): boolean {
        return this.highQuality
    }
}

export {PitchShifter}