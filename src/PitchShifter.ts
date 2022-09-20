import Module from "./rubberband.wasmmodule.js";

interface ChannelsArray {
    ptr: number,
    length: number,
    channelsPtr: number[]
}

class PitchShifter {
    private readonly instance: any;

    public constructor(sampleRate: number, numChannels: number) {
        this.instance = new Module.PitchShifter(sampleRate, numChannels);
        console.log(this.instance)
        PitchShifter.testMemory()
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
        if (channels.length > 0) {
            const length = channels[0].length
            const arr = PitchShifter.createArray(channels.length)
            PitchShifter.writeArray(arr, channels)
            console.log("Pushing to " + arr.ptr)
            this.instance.push(arr.ptr, length);
            //PitchShifter.destroyArray(arr);
        }
    }

    public pull(channels: Float32Array[]): Float32Array[] {
        if (channels.length > 0) {
            const length = channels[0].length
            const arr = PitchShifter.createArray(channels.length)
            //PitchShifter.writeArray(arr, channels)
            //this.instance.pull(arr.ptr, length);
            PitchShifter.destroyArray(arr);
        }
        return channels
    }

    public getVersion(): number {
        return this.instance.getVersion()
    }

    public getSamplesRequired(): number {
        return this.instance.getSamplesRequired()
    }

    private static createArray(length: number): ChannelsArray {
        const channelArrayPtr = Module._malloc(length * Float32Array.BYTES_PER_ELEMENT);
        const channelsPtr: number[] = [];
        for (let channel = 0; channel < length; channel++) {
            const channelPtr = Module._malloc(length * Float32Array.BYTES_PER_ELEMENT);
            channelsPtr.push(channelPtr)
            PitchShifter.memWritePtr(channelArrayPtr + channel * Float32Array.BYTES_PER_ELEMENT, channelPtr);
        }
        return {
            ptr: channelArrayPtr,
            channelsPtr: channelsPtr,
            length: length
        }
    }

    private static writeArray(array: ChannelsArray, channels: Float32Array[]): void {
        for (let channel = 0; channel < channels.length; channel++) {
            PitchShifter.memWrite(array.channelsPtr[channel], channels[channel])
        }
    }

    private static readArray(array: ChannelsArray): Float32Array[] {
        const result = []
        for (let channel = 0; channel < array.channelsPtr.length; channel++) {
            result.push(PitchShifter.memReadF32(array.channelsPtr[channel], array.length))
        }
        return result
    }

    private static destroyArray(channelsArray: ChannelsArray): void {
        console.log("Destroying channel ptrs")
        channelsArray.channelsPtr.forEach(ptr => Module._free(ptr))
        console.log("Destroying array ptr")
        Module._free(channelsArray.ptr)
    }

    private static testMemory() {
        console.log(Float32Array.BYTES_PER_ELEMENT)
        const channels = [
            new Float32Array(128).fill(0.5),
            new Float32Array(128).fill(1.01),
            new Float32Array(128).fill(1.5),
        ]
        // Writing
        const pointers = []
        for (const channel of channels) {
            const ptr = Module._malloc(4)
            pointers.push(ptr)
            PitchShifter.memWrite(ptr, channel)
        }
        // Reading
        const read = []
        for (let channel = 0; channel < channels.length; channel++) {
            const ptr = pointers[channel]
            read.push(PitchShifter.memReadF32(ptr, channels[channel].length))
        }
        console.log("testMemory:")
        console.log(read)

        // Testing with own:
        const arr = PitchShifter.createArray(channels.length)
        PitchShifter.writeArray(arr, channels)
        const read2 = PitchShifter.readArray(arr)
        PitchShifter.destroyArray(arr);
        console.log("testMemory:")
        console.log(read2)
    }

    private static memWritePtr(destPtr: number, srcPtr: number) {
        const buf = new Uint8Array(4);
        const view = new DataView(buf.buffer);
        view.setUint32(0, srcPtr, true);
        Module.HEAP8.set(buf, destPtr);
    }

    private static memWrite(destPtr: number, data: Uint8Array | Float32Array): void {
        const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        Module.HEAP8.set(uint8Array, destPtr);
    }

    private static memReadU8(srcPtr: number, length: number): Int8Array {
        return Module.HEAP8.subarray(srcPtr, srcPtr + length);
    }

    private static memReadF32(srcPtr: number, length: number): Float32Array {
        const res = PitchShifter.memReadU8(srcPtr, length * 4);
        return new Float32Array(res.buffer, res.byteOffset, length);
    }

}

export {PitchShifter}