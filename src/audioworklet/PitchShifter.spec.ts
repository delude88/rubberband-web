import {PitchShifter} from "./PitchShifter";

describe('PitchShifter', () => {
    let pitchShifter: PitchShifter;

    beforeEach(() => {
        pitchShifter = new PitchShifter(44100, 2)
    })

    it('can instantiate', () => {
        expect(pitchShifter).toBeTruthy()
    })

    it('wont instantiate with invalid parameters', () => {
        expect(new PitchShifter(-1, 1)).toThrow();
        expect(new PitchShifter(0, 1)).toThrow();
        expect(new PitchShifter(41100, -1)).toThrow();
        expect(new PitchShifter(48000, 0)).toThrow();
    })
})