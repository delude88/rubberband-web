# rubberband-web

A wasm-powered audio worklet using the [Rubber Band library](https://breakfastquay.com/rubberband/) to provide pitch shifting for the Web Audio API.

## Usage

Add this package to your project using your favorite package manager:
````shell
npm install rubberband-web
# or
yarn add rubberband-web
# or
pnpm add rubberband-web
````

If you are using an framework using assets management (next.js, Angular, etc.), start by copying or linking this package's _public/rubberband-processor.js_ into your public asset folder.
In many cases you can also reference directly to the _node_modules/rubberband-web/public/rubberband-processor.js_.

Then use the helper function _createRubberBandNode_ to create a worklet instance:
```javascript
import { createRubberBandNode } from 'rubberband-web';

const audioCtx = new AudioContext();
const sourceNode = new AudioBufferSourceNode(audioCtx); // or any source

const rubberBandNode = await createRubberBandNode(
          audioCtx,
          '<public path to your rubberband-processor.js copy>'
        );

// Now you can do something like:
sourceNode.connect(rubberBandNode);
rubberBandNode.connect(audioCtx.destination);

// You can change the following parameters live at any time:
rubberBandNode.setPitch(1.2);
rubberBandNode.setTempo(0.6);
rubberBandNode.setHighQuality(true);
```
