import {PitchShifter} from "./PitchShifter.js"

class RubberbandProcessor extends AudioWorkletProcessor {
    private readonly api: PitchShifter;
    private running: boolean = true;

    constructor() {
        super();
        this.api = new PitchShifter(sampleRate, 1)
        console.info("Rubberband engine version", this.api.getVersion())
        this.port.onmessage = (e) => {
            const data = JSON.parse(e.data)
            const event = data[0] as string
            const payload = data[1]
            console.log("port.onmessage", event, payload)
            switch (event) {
                case "pitch": {
                    this.api.setPitch(payload)
                    console.log("samplesRequired", this.api.getSamplesRequired())
                    break;
                }
                case "tempo": {
                    this.api.setTempo(payload)
                    console.log("samplesRequired", this.api.getSamplesRequired())
                    break;
                }
                case "close": {
                    this.close();
                    break;
                }
            }
        }
    }

    close() {
        this.port.onmessage = undefined
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        if (inputs?.length > 0) {
            this.api.push(inputs[0])
        }

        if (outputs?.length > 0) {
            const outputLength = outputs[0][0].length
            if (this.api.getSamplesRequired() > outputLength) {
                this.api.pull(outputs[0])
            }
        }
        return this.running;
    }
}

registerProcessor('rubberband-processor', RubberbandProcessor)