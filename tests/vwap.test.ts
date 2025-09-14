import { VWAP } from "../vwap.js";
import { strict as assert } from "assert";

describe("VWAP", () => {
    it('base case', () => {
        // --- VWAP Tests ---
        const vwap = new VWAP(5000); // 5s window
        const now = Date.now();

        vwap.addTrade({ price: 100, quantity: 2, timestamp: now - 4000 }); // contributes
        vwap.addTrade({ price: 110, quantity: 3, timestamp: now - 2000 }); // contributes
        vwap.addTrade({ price: 120, quantity: 5, timestamp: now });        // contributes

        assert.equal(113, vwap.getVWAP(now));
        // (100*2 + 110*3 + 120*5) / (2+3+5) = (200+330+600)/10 = 113
        // Expected: 113

    })
})