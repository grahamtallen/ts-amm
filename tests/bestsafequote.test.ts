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
        assert.equal(result.exchange, "SushiSwap");
    });

    it("breaks ties using lower slippage percentage", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 1 }, // minOut = 990
            { exchange: "B", amountOut: 1000, slippagePct: 0.5 }, // minOut = 995
        ];
        const result = findBestSafeQuote(quotes);
        assert.equal(result.exchange, "B");
    });
});

describe("findBestSafeQuote - Edge Cases", () => {
    it("returns null or throws if no quotes are provided", () => {
        const quotes: Quote[] = [];
        const result = findBestSafeQuote(quotes);
        expect(result).to.equal(null);
    });

    it("handles a single quote safely", () => {
        const quotes: Quote[] = [
            { exchange: "Uniswap", amountOut: 1000, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("Uniswap");
        expect(result.amountOut).to.equal(1000);
    });

    it("chooses the quote with lowest slippage when minOut ties", () => {
        const quotes: Quote[] = [
            { exchange: "DEXA", amountOut: 1000, slippagePct: 1 },   // minOut = 990
            { exchange: "DEXB", amountOut: 1010, slippagePct: 2 },  // minOut = 989.8
            { exchange: "DEXC", amountOut: 990, slippagePct: 0 },   // minOut = 990
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("DEXC"); // tie at 990, lower slippage wins
    });

    it("ignores quotes with 0 or negative expected output", () => {
        const quotes: Quote[] = [
            { exchange: "BadDEX", amountOut: 0, slippagePct: 1 },
            { exchange: "GoodDEX", amountOut: 1000, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("GoodDEX");
    });

    it("handles extremely high slippage gracefully", () => {
        const quotes: Quote[] = [
            { exchange: "SketchyDEX", amountOut: 2000, slippagePct: 100 }, // minOut = 0
            { exchange: "SolidDEX", amountOut: 1900, slippagePct: 1 },     // minOut = 1881
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("SolidDEX");
    });

    it("handles fractional slippage percentages correctly", () => {
        const quotes: Quote[] = [
            { exchange: "DEXA", amountOut: 1000, slippagePct: 0.1 },  // minOut = 999
            { exchange: "DEXB", amountOut: 1000, slippagePct: 0.01 }, // minOut = 999.9
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("DEXB");
    });

    it("handles very large numbers without precision loss", () => {
        const quotes: Quote[] = [
            { exchange: "MegaDEX", amountOut: 1e18, slippagePct: 0.01 },  // minOut ≈ 0.9999e18
            { exchange: "MiniDEX", amountOut: 1e12, slippagePct: 0 },     // minOut = 1e12
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("MegaDEX");
    });

    it("prefers a safer low-slippage pool when expected outputs are close", () => {
        const quotes: Quote[] = [
            { exchange: "HighSlippage", amountOut: 1005, slippagePct: 5 }, // minOut = 954.75
            { exchange: "StableDEX", amountOut: 1000, slippagePct: 0.1 },  // minOut = 999
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("StableDEX");
    });

    it("correctly handles all quotes having the same slippage", () => {
        const quotes: Quote[] = [
            { exchange: "A", amountOut: 1000, slippagePct: 1 },
            { exchange: "B", amountOut: 1010, slippagePct: 1 },
            { exchange: "C", amountOut: 990, slippagePct: 1 },
        ];
        const result = findBestSafeQuote(quotes);
        expect(result.exchange).to.equal("B");
    });
});

