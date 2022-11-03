export interface RubberBandAPI {
  new(sampleRate: number, channelCount: number, timeRatio: number, pitchScale: number): RubberBandAPI;

  study(heapAddress: number, size: number, final: boolean): void

  process(heapAddress: number, size: number, final: boolean): void

  retrieve(heapAddress: number, size: number): number

  available(): number;

  getSamplesRequired(): number

  setMaxProcessSize(size: number): void
}

export interface RubberBandProcessor {
  new(sampleRate: number, channelCount: number, timeRatio: number, pitchScale: number): RubberBandProcessor;

  setBuffer(heapAddress: number, size: number): number

  getOutputSize(): number

  retrieve(heapAddress: number, size: number): number
}


export interface RealtimeRubberBand {
  new(sampleRate: number, channelCount: number, highQuality: boolean): RealtimeRubberBand;

  study(heapAddress: number, size: number, final: boolean): void

  process(heapAddress: number, size: number, final: boolean): void

  retrieve(heapAddress: number, size: number): number

  available(): number;
}

export interface RubberBandModule extends EmscriptenModule {
  RubberBandAPI: RubberBandAPI
  RealtimeRubberBand: RealtimeRubberBand
  RubberBandProcessor: RubberBandProcessor
}