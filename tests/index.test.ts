import { strict as assert } from "assert";
import { getAmountOutCPMM, getAmountOutCLMM, crossTick } from "../index.js";
import BN from "bn.js";
import { AMOUNT_DEC, PRICE_DEC } from "../constants.js";

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

describe.skip("CPMM math", () => {
    it("small swap from 10X: 10,000 X reserves vs 5,000 Y reserves", () => {
        const result = getAmountOutCPMM(new BN(10), new BN(10000), new BN(5000));
        assert(result.eq(new BN(4))); // expected ~5 Y
    });

    it("larger swap from 1,000 X: 10,000 X reserves vs 5,000 Y reserves", () => {
        const result = getAmountOutCPMM(new BN(1000), new BN(10000), new BN(5000));
        assert(result.eq(new BN(454))); // expected ~454 Y
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

const convertToInt = (input: number | string, decimals: number) => {
    const s = typeof input === "number" ? input.toString() : input;
    const [intPart, fracPart = ""] = s.split(".");

    // pad or trim fractional part
    const frac = fracPart.padEnd(decimals, "0").slice(0, decimals);

    return new BN(intPart + frac);  // safe integer encoding
};




describe.skip("CLMM math", () => {
    it("swap token0→token1 inside a tick", () => {
        let result = getAmountOutCLMM(
            convertToInt(1000, AMOUNT_DEC),
            convertToInt(Math.sqrt(1.1), PRICE_DEC),
            convertToInt(Math.sqrt(1.0), PRICE_DEC),
            true
        );
        assert(result.eq(new BN("48808848170151600000"))); // Corrected: ~49 token1
    });

    it("swap token1→token0 inside a tick", () => {
        const result = getAmountOutCLMM(
            convertToInt(500, AMOUNT_DEC),
            convertToInt(Math.sqrt(1.2), PRICE_DEC),
            convertToInt(Math.sqrt(1.3), PRICE_DEC),
            false
        );
        assert(result.eq(new BN("17906454934123881426"))); // Corrected: ~18 token0
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
describe.skip("CLMM tick crossing", () => {
    it("swapping token0→token1 hits tick boundary", () => {
        // Calculate the amount of token0 needed to cross the tick
        const requiredAmountIn = convertToInt(1000, AMOUNT_DEC).mul(
            convertToInt(Math.sqrt(1.0), PRICE_DEC).sub(convertToInt(Math.sqrt(0.95), PRICE_DEC))
        );
        console.log({ requiredAmountIn })
        const result = crossTick(
            convertToInt(1000, AMOUNT_DEC),
            convertToInt(Math.sqrt(1.0), PRICE_DEC),
            convertToInt(Math.sqrt(0.95), PRICE_DEC),
            true,               // 0→1 → price goes down
            requiredAmountIn
        );
        // The expected amountOut is the amount of token1 from a full tick swap
        const expectedAmountOut = convertToInt(1000, AMOUNT_DEC).mul(
            convertToInt(Math.sqrt(1.0), PRICE_DEC).sub(convertToInt(Math.sqrt(0.95), PRICE_DEC))
        );

        assert(result.amountOut.eq(expectedAmountOut))
        // assert.equal(result.newSqrtPrice.toFixed(4), Math.sqrt(0.95).toFixed(4));
    });

    // it("swapping token1→token0 hits tick boundary", () => {
    //     // Calculate the amount of token1 needed to cross the tick
    //     const requiredAmountIn = 500 * (Math.sqrt(1.15) - Math.sqrt(1.1));
    //     const result = crossTick(500, Math.sqrt(1.1), Math.sqrt(1.15), false, requiredAmountIn);

    //     // The expected amountOut is the amount of token0 from a full tick swap
    //     const expectedAmountOut = 500 * ((1 / Math.sqrt(1.15)) - (1 / Math.sqrt(1.1)));

    //     assert.equal(Math.round(result.amountOut), Math.round(Math.abs(expectedAmountOut)));
    //     assert.equal(result.newSqrtPrice.toFixed(4), Math.sqrt(1.15).toFixed(4));
    // });

    // // New test case for the "runs out of room" scenario
    // it("swapping token0→token1 stops short of boundary", () => {
    //     // We use a small amountIn, which is less than what's needed to cross the tick
    //     const amountIn = 10;

    //     const result = crossTick(1000, Math.sqrt(1.0), Math.sqrt(0.95), true, amountIn);

    //     // Calculate the expected new sqrt price based on the amountIn
    //     const newSqrtPrice = 1 / ((amountIn / 1000) + (1 / Math.sqrt(1.0)));
    //     const expectedAmountOut = 1000 * (Math.sqrt(1.0) - newSqrtPrice);

    //     assert.equal(Math.round(result.amountOut), Math.round(expectedAmountOut));
    //     assert.equal(result.newSqrtPrice.toFixed(4), 0.990099.toFixed(4));
    // });

    // it("swapping token1→token0 stops short of boundary", () => {
    //     // We use a small amountIn, which is less than what's needed to cross the tick
    //     const amountIn = 10;

    //     const result = crossTick(1000, Math.sqrt(1.0), Math.sqrt(1.05), false, amountIn);

    //     // Calculate the expected new sqrt price based on the amountIn
    //     const newSqrtPrice = Math.sqrt(1.0) + (amountIn / 1000);
    //     const expectedAmountOut = 1000 * ((1 / Math.sqrt(1.0)) - (1 / newSqrtPrice));

    //     assert.equal(Math.round(result.amountOut), Math.round(expectedAmountOut));
    //     assert.equal(result.newSqrtPrice.toFixed(4), newSqrtPrice.toFixed(4));
    // });

});