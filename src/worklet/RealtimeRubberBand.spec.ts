import {RealtimeRubberBand} from "./RealtimeRubberBand";

describe('PitchShifter', () => {
    let pitchShifter: RealtimeRubberBand;

    beforeEach(() => {
        pitchShifter = new RealtimeRubberBand(44100, 2)
    })

    it('can instantiate', () => {
        expect(pitchShifter).toBeTruthy()
    })

    it('wont instantiate with invalid parameters', () => {
        expect(new RealtimeRubberBand(-1, 1)).toThrow();
        expect(new RealtimeRubberBand(0, 1)).toThrow();
        expect(new RealtimeRubberBand(41100, -1)).toThrow();
        expect(new RealtimeRubberBand(48000, 0)).toThrow();
    })
})