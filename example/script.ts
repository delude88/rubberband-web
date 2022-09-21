let audioContext: AudioContext;
let source: AudioNode;
let processor: AudioWorkletNode;
let stream: MediaStream;
let fileBuffer: ArrayBuffer;

async function createWorkletNode(
  context: BaseAudioContext,
  name: string,
  url: string
) {
  // ensure audioWorklet has been loaded
  try {
    return new AudioWorkletNode(context, name)
  } catch (err) {
    await context.audioWorklet.addModule(url)
    return new AudioWorkletNode(context, name)
  }
}

function enablePlayer() {
  document.getElementById("play").removeAttribute("disabled")
}

function disablePlayer() {
  document.getElementById("play").setAttribute("disabled", "disabled")
}

function enableControls() {
  disablePlayer()
  document.getElementById("osc").setAttribute("disabled", "disabled");
  document.getElementById("mic").setAttribute("disabled", "disabled");
  document.getElementById("pitch").removeAttribute("disabled");
  document.getElementById("tempo").removeAttribute("disabled");
  document.getElementById("quality").removeAttribute("disabled");
  document.getElementById("stop").removeAttribute("disabled");
}

function disableControls() {
  document.getElementById("osc").removeAttribute("disabled");
  document.getElementById("mic").removeAttribute("disabled");
  document.getElementById("pitch").setAttribute("disabled", "disabled");
  document.getElementById("tempo").setAttribute("disabled", "disabled");
  document.getElementById("quality").setAttribute("disabled", "disabled");
  document.getElementById("stop").setAttribute("disabled", "disabled");
  if (fileBuffer) {
    enablePlayer()
  }
}

async function startEngine() {
  audioContext = new AudioContext()
  await audioContext.resume()
  enableControls()
  processor = await createWorkletNode(audioContext, "rubberband-processor", "../dist/rubberband-processor.js")
}

async function stopEngine() {
  if (processor) {
    processor.port.postMessage(JSON.stringify(["close"]));
  }
  if (processor && audioContext) {
    processor.disconnect(audioContext.destination);
  }
  if (source && processor) {
    source.disconnect(processor);
  }
  if (audioContext) {
    await audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  disableControls()
}

async function startOscillator() {
  await startEngine();

  // Create source (oscillator)
  const oscillatorNode = new OscillatorNode(audioContext, {
    frequency: 380,
    type: 'sine',
  });
  oscillatorNode.start()
  source = oscillatorNode

  // Connect nodes
  source.connect(processor);
  processor.connect(audioContext.destination);
}

async function startMic() {
  await startEngine();

  stream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    });

  source = new MediaStreamAudioSourceNode(audioContext, {
    mediaStream: stream,
  });

  // Connect nodes
  source.connect(processor);
  processor.connect(audioContext.destination);
}

function handlePitch(value) {
  if (processor) {
    processor.port.postMessage(JSON.stringify(["pitch", value]));
  }
}

function handleTempo(value) {
  if (processor) {
    processor.port.postMessage(JSON.stringify(["tempo", value]));
  }
}

function handleQuality(value) {
  if (processor) {
    processor.port.postMessage(JSON.stringify(["quality", value]));
  }
}

let fileAudioBuffer: AudioBuffer

async function playFile() {
  if (fileBuffer) {
    disablePlayer()
    await startEngine()

    // Clone array
    //const clonedFileBuffer = new ArrayBuffer(fileBuffer.byteLength)
    //new Uint8Array(clonedFileBuffer).set(new Uint8Array(fileBuffer))

    if (!fileAudioBuffer) {
      fileAudioBuffer = await audioContext.decodeAudioData(fileBuffer)
    }
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = fileAudioBuffer
    bufferSource.loop = true
    source = bufferSource
    bufferSource.start()

    // Connect nodes
    source.connect(processor);
    processor.connect(audioContext.destination);
  }
}

async function onFile(element: HTMLInputElement) {
  fileBuffer = undefined
  fileAudioBuffer = undefined
  const file = element.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    if (typeof event.target.result === "object") {
      fileBuffer = event.target.result
      enablePlayer()
    }
  };
  reader.readAsArrayBuffer(file);
}