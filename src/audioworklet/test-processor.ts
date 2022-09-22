const importObject = {
    imports: {
    }
};

class TestProcessor extends AudioWorkletProcessor {
    private module: BufferSource | undefined = undefined

    constructor() {
        super();
        this.port.onmessage = (e) => {
            console.log("GOT MESSAGE")
            console.log("port.onmessage", e.data)
        }
        console.log("TestProcessor loaded")
    }

    init() {
        if(this.module) {
            WebAssembly.instantiate(this.module, importObject).then((instance) => {
                console.log(instance);
            });
        }
    }

    process(_inputs: Float32Array[][], _outputs: Float32Array[][]): boolean {
        return true
    }
}

registerProcessor('test-processor', TestProcessor)