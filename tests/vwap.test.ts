import { VWAP } from "../vwap.js";
import { strict as assert } from "assert";

describe("VWAP", () => {
    it("base case", () => {
        const vwap = new VWAP(5000); // 5s window
        const now = Date.now();

        vwap.addTrade({ price: 100, quantity: 2, timestamp: now - 4000 }); // contributes
        vwap.addTrade({ price: 120, quantity: 5, timestamp: now });        // contributes
        vwap.addTrade({ price: 110, quantity: 3, timestamp: now - 2000 }); // contributes

        assert.equal(113, vwap.getVWAP(now));
    });

    it("ignores trades outside window", () => {
        const now = Date.now();
        const vwap = new VWAP(5000); // 5s window

        vwap.addTrade({ price: 90, quantity: 10, timestamp: now - 6000 }); // too old
        vwap.addTrade({ price: 100, quantity: 5, timestamp: now - 1000 }); // contributes
        vwap.addTrade({ price: 110, quantity: 5, timestamp: now });        // contributes

        // (100*5 + 110*5) / (5+5) = 105
        assert.equal(105, vwap.getVWAP(now));
    });

    it("handles single trade", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        vwap.addTrade({ price: 250, quantity: 4, timestamp: now });

        assert.equal(250, vwap.getVWAP(now));
    });

    it("handles zero-quantity trades gracefully", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        vwap.addTrade({ price: 200, quantity: 0, timestamp: now - 1000 }); // ignored
        vwap.addTrade({ price: 300, quantity: 2, timestamp: now });        // contributes

        assert.equal(300, vwap.getVWAP(now));
    });

    it("large quantity dominates VWAP", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        vwap.addTrade({ price: 50, quantity: 1, timestamp: now - 1000 });
        vwap.addTrade({ price: 200, quantity: 100, timestamp: now }); // dominates

        // (50*1 + 200*100) / (101) ≈ 198.51 → rounds to 199
        assert.equal(199, Math.round(vwap.getVWAP(now)));
    });

    it("returns NaN or 0 if no trades in window", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        vwap.addTrade({ price: 100, quantity: 2, timestamp: now - 10_000 }); // too old

        assert.ok(Number.isNaN(vwap.getVWAP(now)) || vwap.getVWAP(now) === 0);
    });

    it("handles trade arriving late but still in window", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        // Add a "newer" trade first
        vwap.addTrade({ price: 200, quantity: 2, timestamp: now });

        // Then add an "older" trade (still inside window)
        vwap.addTrade({ price: 100, quantity: 2, timestamp: now - 4000 });

        // VWAP = (200*2 + 100*2) / (4) = 150
        assert.equal(150, vwap.getVWAP(now));
    });

    it("ignores late trade that is outside of window", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        // Add recent trade
        vwap.addTrade({ price: 200, quantity: 2, timestamp: now });

        // Add "older" trade, but outside 5s window
        vwap.addTrade({ price: 50, quantity: 10, timestamp: now - 10_000 });

        // Expected VWAP should only include the 200-price trade
        assert.equal(200, vwap.getVWAP(now));
    });

    it("handles multiple out-of-order trades correctly", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        // Insert trades not in time order
        vwap.addTrade({ price: 150, quantity: 1, timestamp: now - 2000 });
        vwap.addTrade({ price: 100, quantity: 2, timestamp: now - 4000 });
        vwap.addTrade({ price: 200, quantity: 3, timestamp: now });

        // VWAP = (100*2 + 150*1 + 200*3) / (6) = (200 + 150 + 600) / 6 = 950 / 6 ≈ 158.33
        assert.equal(158, Math.round(vwap.getVWAP(now)));
    });

    it("trade added after getVWAP shouldn't change past results if it's too old", () => {
        const vwap = new VWAP(5000);
        const now = Date.now();

        vwap.addTrade({ price: 120, quantity: 2, timestamp: now - 1000 });
        assert.equal(120, vwap.getVWAP(now));

        // Add a very old trade after the fact
        vwap.addTrade({ price: 10, quantity: 10, timestamp: now - 20_000 });

        // VWAP should remain unchanged
        assert.equal(120, vwap.getVWAP(now));
    });
});
