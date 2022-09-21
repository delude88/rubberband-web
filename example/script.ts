let audioContext;
let source;
let processor;

// @ts-ignore
async function start() {
  audioContext = new AudioContext();
  await audioContext.resume();
  document.getElementById("osc").setAttribute("disabled", "disabled");
  document.getElementById("mic").setAttribute("disabled", "disabled");
  document.getElementById("pitch").removeAttribute("disabled");
  document.getElementById("tempo").removeAttribute("disabled");
  document.getElementById("quality").removeAttribute("disabled");
  document.getElementById("stop").removeAttribute("disabled");

  // Load rubberband processor
  await audioContext.audioWorklet.addModule("../dist/rubberband-processor.js");
  processor = new AudioWorkletNode(audioContext, "rubberband-processor");
}

async function stop() {
  if (processor && audioContext) {
    processor.disconnect(audioContext.destination);
  }
  if (source && processor) {
    source.disconnect(processor);
  }
  if (processor) {
    processor.port.postMessage(JSON.stringify(["close"]));
  }
  if (audioContext) {
    audioContext.close();
  }
  document.getElementById("osc").removeAttribute("disabled");
  document.getElementById("mic").removeAttribute("disabled");
  document.getElementById("pitch").setAttribute("disabled", "disabled");
  document.getElementById("tempo").setAttribute("disabled", "disabled");
  document.getElementById("quality").setAttribute("disabled", "disabled");
  document.getElementById("stop").setAttribute("disabled", "disabled");
}

async function osc() {
  await start();

  // Create source (oscillator)
  source = new OscillatorNode(audioContext, {
    frequency: 380,
    type: 'sine',
  });

  // Connect nodes
  source.connect(processor);
  processor.connect(audioContext.destination);

  // Start everything
  source.start();
}

async function mic() {
  await start();

  // Create source (oscillator)
  const stream = await navigator.mediaDevices
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