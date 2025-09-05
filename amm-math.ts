import BN from "bn.js";
import { SCALE_36, SCALE_18 } from "./constants.js";

export function getAmountOutCPMM(xIn: BN, xReserves: BN, yReserves: BN): BN {
    const numerator = xIn.mul(yReserves);
    const denominator = xReserves.add(xIn);
    return numerator.div(denominator);
}

/*
 * Hint: use formulas:
 *   - if zeroForOne: Δy = L * (sqrtPriceStart - sqrtPriceEnd)
 *   - if oneForZero: Δx = L * (1/sqrtPriceEnd - 1/sqrtPriceStart)
 */


export function getAmountOutCLMM(
    L: BN,
    sqrtPriceStart: BN,
    sqrtPriceEnd: BN,
    zeroForOne: boolean
): BN {
    const factor = SCALE_36;
    let result: BN;
    if (zeroForOne) {
        result = L.mul(sqrtPriceStart.sub(sqrtPriceEnd)).div(factor);
    } else {
        console.log(sqrtPriceStart.toString(), sqrtPriceEnd.toString())
        const Q = new BN(10).pow(new BN(72)); // scaling factor // todo replace with price decimals constant doubled
        const invEnd = Q.div(sqrtPriceEnd);   // ≈ 1/sqrtPriceEnd
        const invStart = Q.div(sqrtPriceStart);
        console.log(invStart.toString(), invEnd.toString())
        result = L.mul(invStart.sub(invEnd)).div(factor); // adjust for scaling
    }
    return result;
}


export function crossTick(
    L: BN,
    sqrtPriceCurrent: BN,
    sqrtPriceNextTick: BN,
    zeroForOne: boolean,
    amountIn: BN,
    SCALED_ONE: BN
): { amountOut: BN, newSqrtPrice: BN } {
    console.log('amountIn', amountIn.toString());
    if (amountIn.lte(new BN(0))) {
        throw new Error('amountIn must be positive');
    }
    // check inputs are correct, price moves in expected direction
    if (zeroForOne) {
        if (sqrtPriceCurrent.lte(sqrtPriceNextTick)) {
            throw new Error('Invalid input');
        }
    } else {
        if (sqrtPriceCurrent.gte(sqrtPriceNextTick)) {
            throw new Error('Invalid input');
        }
    }
    let amountOut: BN = new BN(0);
    let newSqrtPrice: BN = new BN(0);
    if (zeroForOne) {
        const amountInToBoundary = L.mul(sqrtPriceCurrent.sub(sqrtPriceNextTick)).mul(SCALED_ONE).div(sqrtPriceCurrent.mul(sqrtPriceNextTick));
        console.log('amountInToBoundary', amountInToBoundary.toString());
        if (amountIn.lte(amountInToBoundary)) {
            newSqrtPrice = SCALED_ONE.div(SCALED_ONE.div(sqrtPriceCurrent).add(amountIn.mul(SCALED_ONE).div(L)));
            amountOut = L.mul(sqrtPriceCurrent.sub(newSqrtPrice));
        }
    } else {
        const amountInToBoundary = L.mul(sqrtPriceNextTick.sub(sqrtPriceCurrent));
        if (amountIn.lte(amountInToBoundary)) {
            newSqrtPrice = sqrtPriceCurrent.add(amountIn.div(L));
            amountOut = L.mul(SCALED_ONE.div(sqrtPriceCurrent).sub(SCALED_ONE.div(newSqrtPrice)));
        }
    }
    return {
        amountOut,
        newSqrtPrice,
    }
}