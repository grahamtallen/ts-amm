import { findBestSafeQuote } from "../bestsafequote.js";
import { Quote } from "../interfaces.js";
import { strict as assert } from "assert";


describe("findBestSafeQuote", () => {
    it("chooses the exchange with the best min guaranteed output", () => {
        const quotes: Quote[] = [
            { exchange: "Uniswap", amountOut: 1050, slippagePct: 2 }, // minOut = 1029
            { exchange: "SushiSwap", amountOut: 1040, slippagePct: 0.5 }, // minOut = 1034.8
            { exchange: "Curve", amountOut: 1020, slippagePct: 0.1 }, // minOut = 1018.98
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "SushiSwap");
    });

    it("breaks ties using lower slippage percentage", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 1 }, // minOut = 990
            { exchange: "B", amountOut: 1000, slippagePct: 0.5 }, // minOut = 995
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "B");
    });
});

describe("findBestSafeQuote - Edge Cases", () => {
    it("returns null or throws if no quotes are provided", () => {
        const quotes: Quote[] = [];
        const result = findBestSafeQuote(quotes);
        assert.equal(result, null);
    });

    it("handles a single quote safely", () => {
        const quotes: Quote[] = [
            { exchange: "Uniswap", amountOut: 1000, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "Uniswap");
        assert.equal(result?.amountOut, 1000);
    });

    it("chooses the quote with lowest slippage when minOut ties", () => {
        const quotes: Quote[] = [
            { exchange: "DEXA", amountOut: 1000, slippagePct: 1 },   // minOut = 990
            { exchange: "DEXB", amountOut: 1010, slippagePct: 2 },  // minOut = 989.8
            { exchange: "DEXC", amountOut: 990, slippagePct: 0 },   // minOut = 990
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "DEXC"); // tie at 990, lower slippage wins
    });

    it("ignores quotes with 0 or negative expected output", () => {
        const quotes: Quote[] = [
            { exchange: "BadDEX", amountOut: 0, slippagePct: 1 },
            { exchange: "GoodDEX", amountOut: 1000, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "GoodDEX");
    });

    it("handles extremely high slippage gracefully", () => {
        const quotes: Quote[] = [
            { exchange: "SketchyDEX", amountOut: 2000, slippagePct: 100 }, // minOut = 0
            { exchange: "SolidDEX", amountOut: 1900, slippagePct: 1 },     // minOut = 1881
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "SolidDEX");
    });

    it("handles fractional slippage percentages correctly", () => {
        const quotes: Quote[] = [
            { exchange: "DEXA", amountOut: 1000, slippagePct: 0.1 },  // minOut = 999
            { exchange: "DEXB", amountOut: 1000, slippagePct: 0.01 }, // minOut = 999.9
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "DEXB");
    });

    it("handles very large numbers without precision loss", () => {
        const quotes: Quote[] = [
            { exchange: "MegaDEX", amountOut: 1e18, slippagePct: 0.01 },  // minOut ≈ 0.9999e18
            { exchange: "MiniDEX", amountOut: 1e12, slippagePct: 0 },     // minOut = 1e12
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "MegaDEX");
    });

    it("prefers a safer low-slippage pool when expected outputs are close", () => {
        const quotes: Quote[] = [
            { exchange: "HighSlippage", amountOut: 1005, slippagePct: 5 }, // minOut = 954.75
            { exchange: "StableDEX", amountOut: 1000, slippagePct: 0.1 },  // minOut = 999
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "StableDEX");
    });

    it("correctly handles all quotes having the same slippage", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 1 },
            { exchange: "B", amountOut: 1010, slippagePct: 1 },
            { exchange: "C", amountOut: 990, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result?.exchange, "B");
    });
});

describe("findBestSafeQuote - breaking edge cases", () => {
    it("fails when the second quote is better but the third is worse, due to stale highestQuoteWithSlippage", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 0 }, // minOut = 1000
            { exchange: "B", amountOut: 1100, slippagePct: 0 }, // minOut = 1100 (best)
            { exchange: "C", amountOut: 900, slippagePct: 0 },  // minOut = 900 (worse)
        ];
        const result = findBestSafeQuote(quotes);
        // ❌ Your current code may incorrectly return C
        assert.equal(result?.exchange, "B");
    });

    it("mishandles floating point precision in tie-breaking", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 0.0000001 }, // minOut ≈ 999.9999999
            { exchange: "B", amountOut: 1000, slippagePct: 0 },         // minOut = 1000
        ];
        const result = findBestSafeQuote(quotes);
        // ❌ Strict === comparison may not trigger tie-break correctly
        assert.equal(result?.exchange, "B");
    });

    it("does not filter out a quote with zero output", () => {
        const quotes: Quote[] = [
            { exchange: "BadDEX", amountOut: 0, slippagePct: 1 },
            { exchange: "GoodDEX", amountOut: 1000, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        // ❌ Your current code may return BadDEX incorrectly
        assert.equal(result?.exchange, "GoodDEX");
    });

    it("does not filter out a quote with negative slippage", () => {
        const quotes: Quote[] = [
            { exchange: "WeirdDEX", amountOut: 1000, slippagePct: -5 }, // minOut = 1050 (!)
            { exchange: "NormalDEX", amountOut: 1000, slippagePct: 1 }, // minOut = 990
        ];
        const result = findBestSafeQuote(quotes);
        // ❌ Negative slippage shouldn't be allowed, but your code might pick WeirdDEX
        assert.equal(result?.exchange, "NormalDEX");
    });
});

