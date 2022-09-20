import Module from "./rubberband.wasmmodule.js";
import HeapArray from "./HeapArray.js";

const RENDER_QUANTUM_FRAMES = 128;

class PitchShifter {
  private readonly instance: any;
  private readonly numSamples: number;
  private inputArray: HeapArray;
  private outputArray: HeapArray;

  public constructor(sampleRate: number, numChannels: number, numSamples: number = RENDER_QUANTUM_FRAMES) {
    this.numSamples = numSamples
    this.instance = new Module.PitchShifter(sampleRate, numChannels);
    this.inputArray = new HeapArray(Module, RENDER_QUANTUM_FRAMES, numChannels);
    this.outputArray = new HeapArray(Module, RENDER_QUANTUM_FRAMES, numChannels);
  }

  public setTempo(tempo: number) {
    this.instance.setTempo(tempo)
  }

  public setPitch(pitch: number) {
    this.instance.setPitch(pitch)
  }

  public get samplesAvailable(): number {
    return this.instance.samplesAvailable()
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

  public getSamplesRequired(): number {
    return this.instance.getSamplesRequired()
  }

}

export {PitchShifter}