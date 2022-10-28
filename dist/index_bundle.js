/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../dist/esm5/createRubberBandWorker.js":
/*!**********************************************!*\
  !*** ../dist/esm5/createRubberBandWorker.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"createRubberBandWorker\": () => (/* binding */ createRubberBandWorker)\n/* harmony export */ });\nvar cloneArrayBuffer = function cloneArrayBuffer(source) {\n  var dest = new ArrayBuffer(source.byteLength);\n  new Uint8Array(dest).set(new Uint8Array(source));\n  return dest;\n};\nvar createRubberBandWorker = function createRubberBandWorker(url) {\n  var worker = new Worker(url);\n  worker.process = function (audioBuffer, tempo, pitch) {\n    if (pitch === void 0) {\n      pitch = 1;\n    }\n    return new Promise(function (resolve, reject) {\n      var onMessage = function onMessage(_a) {\n        var data = _a.data;\n        worker.removeEventListener('message', onMessage);\n        var event = data.event;\n        if (event === 'process') {\n          var channels = data.channels;\n          if (channels) {\n            var length_1 = channels[0].byteLength / Float32Array.BYTES_PER_ELEMENT;\n            var processedAudioBuffer = new AudioBuffer({\n              length: length_1,\n              numberOfChannels: audioBuffer.numberOfChannels,\n              sampleRate: audioBuffer.sampleRate\n            });\n            for (var i = 0; i < channels.length; i++) {\n              processedAudioBuffer.copyToChannel(new Float32Array(channels[i]), i);\n            }\n            resolve(processedAudioBuffer);\n          }\n        } else if (event === 'error') {\n          var error = data.error;\n          reject(new Error(error));\n        } else {\n          reject(new Error(\"Unexpected event \".concat(event)));\n        }\n      };\n      worker.addEventListener('message', onMessage);\n      var transfer = [];\n      for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {\n        var source = audioBuffer.getChannelData(channel).buffer;\n        transfer.push(cloneArrayBuffer(source));\n      }\n      console.log(\"BEFORE\");\n      for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {\n        console.log(\"Length of source channel buffer: \".concat(audioBuffer.getChannelData(channel).byteLength));\n      }\n      for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {\n        console.log(\"Length of transfer channel buffer: \".concat(transfer[channel].byteLength));\n      }\n      worker.postMessage({\n        event: 'process',\n        pitch: pitch,\n        tempo: tempo,\n        sampleRate: audioBuffer.sampleRate,\n        channels: transfer\n      }, transfer);\n      console.log(\"AFTER\");\n      for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {\n        console.log(\"Length of source channel buffer: \".concat(audioBuffer.getChannelData(channel).byteLength));\n      }\n      for (var channel = 0; channel < audioBuffer.numberOfChannels; channel++) {\n        console.log(\"Length of transfer channel buffer: \".concat(transfer[channel].byteLength));\n      }\n    });\n  };\n  return worker;\n};\n\n\n//# sourceURL=webpack:///../dist/esm5/createRubberBandWorker.js?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../.. */ \"../dist/esm5/createRubberBandWorker.js\");\nfunction _typeof(obj) { \"@babel/helpers - typeof\"; return _typeof = \"function\" == typeof Symbol && \"symbol\" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && \"function\" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }, _typeof(obj); }\n\nvar audioContext = new AudioContext();\nvar worker = (0,___WEBPACK_IMPORTED_MODULE_0__.createRubberBandWorker)('../../public/rubberband.worker.js');\nvar initUI = function initUI(fileChooser, playButton, tempoChooser) {\n  var context = {\n    tempo: 1,\n    playing: false\n  };\n  var stop = function stop() {\n    if (context.playNode) {\n      context.playNode.stop();\n      context.playNode.disconnect();\n      context.playing = false;\n      playButton.textContent = 'Play';\n    }\n  };\n  var restart = function restart() {\n    if (context.playBuffer) {\n      stop();\n      context.playNode = audioContext.createBufferSource();\n      context.playNode.connect(audioContext.destination);\n      context.playNode.loop = true;\n      context.playNode.buffer = context.playBuffer;\n      context.playNode.start();\n      context.playing = true;\n      playButton.textContent = 'Stop';\n    }\n  };\n  var setPlayBuffer = function setPlayBuffer(audioBuffer) {\n    context.playBuffer = audioBuffer;\n    if (context.playing) {\n      restart();\n    }\n  };\n  var handleAudioBufferOrTempoChange = function handleAudioBufferOrTempoChange() {\n    if (context.source) {\n      //if (context.tempo !== 1) {\n      // First pitch shift play buffer\n      console.info(\"Processing audio buffer with tempo \".concat(context.tempo));\n      worker.process(context.source, context.tempo).then(function (audioBuffer) {\n        var _context$source;\n        console.info(\"AudioBuffer length changed from \".concat((_context$source = context.source) === null || _context$source === void 0 ? void 0 : _context$source.length, \" to \").concat(audioBuffer.length, \" with tempo \").concat(context.tempo * 100, \"%\"));\n        setPlayBuffer(audioBuffer);\n        context.playBuffer = context.source;\n        if (context.playing) {\n          restart();\n        }\n      });\n      /*} else {\n        console.info(`Skip processing audio buffer, since tempo is simply 1`)\n        setPlayBuffer(context.source)\n      }*/\n    }\n  };\n\n  playButton.onclick = function () {\n    void audioContext.resume();\n    if (context.playing) {\n      stop();\n    } else {\n      restart();\n    }\n  };\n  tempoChooser.onchange = function () {\n    context.tempo = Number.parseFloat(tempoChooser.value);\n    handleAudioBufferOrTempoChange();\n  };\n  fileChooser.onchange = function () {\n    if (fileChooser.files) {\n      var file = fileChooser.files[0];\n      var reader = new FileReader();\n      reader.onload = function (event) {\n        var _event$target;\n        if ((_event$target = event.target) !== null && _event$target !== void 0 && _event$target.result && _typeof(event.target.result) === 'object') {\n          audioContext.decodeAudioData(event.target.result).then(function (audioBuffer) {\n            context.source = audioBuffer;\n            handleAudioBufferOrTempoChange();\n            playButton.disabled = false;\n          });\n        }\n      };\n      reader.readAsArrayBuffer(file);\n    } else {\n      playButton.disabled = true;\n    }\n  };\n  playButton.disabled = true;\n};\nvar fileChooser = document.getElementById('file');\nvar playButton = document.getElementById('play');\nvar tempoChooser = document.getElementById('tempo');\nif (fileChooser && playButton) {\n  initUI(fileChooser, playButton, tempoChooser);\n}\n\n//# sourceURL=webpack:///./src/index.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;