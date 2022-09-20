import Module from "./rubberband.wasmmodule.js";

class PitchShifter {
    private instance: any;

    public constructor(sampleRate: number, numChannels: number) {
        this.instance = new Module.PitchShifter(sampleRate, numChannels);
    }

    public setTempo(tempo: number) {
        this.instance.setTempo(tempo)
    }

    public setPitch(pitch: number) {
        this.instance.setPitch(pitch)
    }

    public getVersion(): number {
       return this.instance.getVersion()
    }

    public getSamplesRequired(): number {
        return this.instance.getSamplesRequired()
    }
}
export {PitchShifter}