import { strict as assert } from "assert";
import { getAmountOutCPMM, getAmountOutCLMM, crossTick } from "../index.js";
/**
 * ===========================
 * CPMM (Constant Product AMM)
 * ===========================
 */

/**
 * Function under test:
 *   getAmountOutCPMM(xIn: number, xReserves: number, yReserves: number): number
 *
 * Given:
 *   - xIn: amount of token X you want to swap in
 *   - xReserves: current reserves of X
 *   - yReserves: current reserves of Y
 *
 * Return:
 *   - amount of Y you would get out, ignoring fees
 *
 * Hint: use xReserves * yReserves = k
 */

describe("CPMM math", () => {
    it("small swap from 10X: 10,000 X reserves vs 5,000 Y reserves", () => {
        const result = getAmountOutCPMM(10, 10000, 5000);
        assert.equal(Math.round(result), 5); // expected ~5 Y
    });

    it("larger swap from 1,000 X: 10,000 X reserves vs 5,000 Y reserves", () => {
        const result = getAmountOutCPMM(1000, 10000, 5000);
        assert.equal(Math.round(result), 455); // expected ~454 Y
    });
});


/**
 * ===========================
 * CLMM (Concentrated Liquidity AMM)
 * ===========================
 */

/**
 * Function under test:
 *   getAmountOutCLMM(L: number, sqrtPriceStart: number, sqrtPriceEnd: number, zeroForOne: boolean): number
 *
 * Given:
 *   - L: liquidity (constant within a tick)
 *   - sqrtPriceStart: current sqrt(P)
 *   - sqrtPriceEnd: target sqrt(P) after the swap
 *   - zeroForOne: if true, swapping token0 for token1; else the reverse
 *
 * Return:
 *   - amount of token out
 *
 * Hint: use formulas:
 *   - if zeroForOne: Δy = L * (sqrtPriceStart - sqrtPriceEnd)
 *   - if oneForZero: Δx = L * (1/sqrtPriceEnd - 1/sqrtPriceStart)
 */

describe("CLMM math", () => {
    it("swap token0→token1 inside a tick", () => {
        const result = getAmountOutCLMM(1000, Math.sqrt(1.0), Math.sqrt(1.1), true);
        assert.equal(Math.round(result), 49); // Corrected: ~49 token1
    });

    it("swap token1→token0 inside a tick", () => {
        const result = getAmountOutCLMM(500, Math.sqrt(1.2), Math.sqrt(1.3), false);
        assert.equal(Math.round(result), 18); // Corrected: ~18 token0
    });
});
/**
 * ===========================
 * Tick Crossing (CLMM)
 * ===========================
 */

/**
 * Function under test:
 * crossTick(L: number, sqrtPriceCurrent: number, sqrtPriceNextTick: number, zeroForOne: boolean, amountIn: number): { amountOut: number, newSqrtPrice: number }
 *
 * Given:
 * - L: liquidity (constant within a tick)
 * - sqrtPriceCurrent: current sqrt(P)
 * - sqrtPriceNextTick: sqrt(P) of the next tick boundary
 * - zeroForOne: if true, swapping token0 for token1; else the reverse
 * - amountIn: the amount of tokens to swap
 *
 * Return:
 * - amount of token out and the new sqrt price after the swap
 *
 * Hint: compute max possible Δx or Δy before reaching sqrtPriceNextTick and compare with amountIn.
 */
describe("CLMM tick crossing", () => {
    it.only("swapping token0→token1 hits tick boundary", () => {
        // Calculate the amount of token0 needed to cross the tick
        const requiredAmountIn = 1000 * ((1 / Math.sqrt(0.95)) - (1 / Math.sqrt(1.0)));
        console.log({ requiredAmountIn })
        const result = crossTick(
            1000,
            Math.sqrt(1.0),     // current = 1.0
            Math.sqrt(0.95),    // next lower boundary = 0.95
            true,               // 0→1 → price goes down
            Math.abs(requiredAmountIn)
        );
        // The expected amountOut is the amount of token1 from a full tick swap
        const expectedAmountOut = 1000 * (Math.sqrt(1.0) - Math.sqrt(0.95));

        assert.equal(Math.round(result.amountOut), Math.round(expectedAmountOut));
        assert.equal(result.newSqrtPrice.toFixed(4), Math.sqrt(0.95).toFixed(4));
    });

    it("swapping token1→token0 hits tick boundary", () => {
        // Calculate the amount of token1 needed to cross the tick
        const requiredAmountIn = 500 * (Math.sqrt(1.15) - Math.sqrt(1.1));
        const result = crossTick(500, Math.sqrt(1.1), Math.sqrt(1.15), false, requiredAmountIn);

        // The expected amountOut is the amount of token0 from a full tick swap
        const expectedAmountOut = 500 * ((1 / Math.sqrt(1.15)) - (1 / Math.sqrt(1.1)));

        assert.equal(Math.round(result.amountOut), Math.round(Math.abs(expectedAmountOut)));
        assert.equal(result.newSqrtPrice.toFixed(4), Math.sqrt(1.15).toFixed(4));
    });

    // New test case for the "runs out of room" scenario
    it("swapping token0→token1 stops short of boundary", () => {
        // We use a small amountIn, which is less than what's needed to cross the tick
        const amountIn = 10;

        const result = crossTick(1000, Math.sqrt(1.0), Math.sqrt(0.95), true, amountIn);

        // Calculate the expected new sqrt price based on the amountIn
        const newSqrtPrice = 1 / ((amountIn / 1000) + (1 / Math.sqrt(1.0)));
        const expectedAmountOut = 1000 * (Math.sqrt(1.0) - newSqrtPrice);

        assert.equal(Math.round(result.amountOut), Math.round(expectedAmountOut));
        assert.equal(result.newSqrtPrice.toFixed(4), 0.990099.toFixed(4));
    });

    it("swapping token1→token0 stops short of boundary", () => {
        // We use a small amountIn, which is less than what's needed to cross the tick
        const amountIn = 10;

        const result = crossTick(1000, Math.sqrt(1.0), Math.sqrt(1.05), false, amountIn);

        // Calculate the expected new sqrt price based on the amountIn
        const newSqrtPrice = Math.sqrt(1.0) + (amountIn / 1000);
        const expectedAmountOut = 1000 * ((1 / Math.sqrt(1.0)) - (1 / newSqrtPrice));

        assert.equal(Math.round(result.amountOut), Math.round(expectedAmountOut));
        assert.equal(result.newSqrtPrice.toFixed(4), newSqrtPrice.toFixed(4));
    });

});