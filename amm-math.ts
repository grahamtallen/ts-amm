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
    zeroForOne: boolean,
): BN {
    const factor = SCALE_36;
    let result: BN;
    if (zeroForOne) {
        result = L.mul(sqrtPriceStart.sub(sqrtPriceEnd)).div(factor);
    } else {
        console.log(sqrtPriceStart.toString(), sqrtPriceEnd.toString());
        const Q = new BN(10).pow(new BN(72)); // scaling factor // todo replace with price decimals constant doubled
        const invEnd = Q.div(sqrtPriceEnd); // ≈ 1/sqrtPriceEnd
        const invStart = Q.div(sqrtPriceStart);
        console.log(invStart.toString(), invEnd.toString());
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
    SCALED_ONE: BN,
): { amountOut: BN; newSqrtPrice: BN } {
    if (amountIn.lte(new BN(0))) {
        throw new Error("amountIn must be positive");
    }

    // direction sanity check
    if (zeroForOne) {
        if (sqrtPriceCurrent.lte(sqrtPriceNextTick)) {
            throw new Error("Invalid input");
        }
    } else {
        if (sqrtPriceCurrent.gte(sqrtPriceNextTick)) {
            throw new Error("Invalid input");
        }
    }

    let amountOut = new BN(0);
    let newSqrtPrice = new BN(0);

    if (zeroForOne) {
        // Δx = L * (sqrtStart - sqrtEnd) / (sqrtStart * sqrtEnd)
        const amountInToBoundary = L
            .mul(sqrtPriceCurrent.sub(sqrtPriceNextTick))
            .mul(SCALED_ONE)
            .div(sqrtPriceCurrent.mul(sqrtPriceNextTick));

        if (amountIn.lte(amountInToBoundary)) {
            // newSqrt = 1 / (1/√Pcurrent + Δx/L)
            const invCurrent = SCALED_ONE.div(sqrtPriceCurrent); // scaled 1/√P
            const term = amountIn.mul(SCALED_ONE).div(L);        // scaled Δx/L
            const invNew = invCurrent.add(term);                 // scaled
            newSqrtPrice = SCALED_ONE.div(invNew);
            // note: multiply by SCALED_ONE so final stays in same scale as sqrtPrice

            // Δy = L * (√Pcurrent - √Pnew)
            amountOut = L.mul(sqrtPriceCurrent.sub(newSqrtPrice));
            console.log("sqrtCurrent", sqrtPriceCurrent.toString());
            console.log("sqrtEnd    ", sqrtPriceNextTick.toString());
            console.log("newSqrt   ", newSqrtPrice.toString());

        } else {
            // full boundary case
            newSqrtPrice = sqrtPriceNextTick;
            amountOut = L.mul(sqrtPriceCurrent.sub(sqrtPriceNextTick));
        }
    } else {
        // token1→token0
        // Δy = L * (√Pend - √Pstart)
        const amountInToBoundary = L.mul(sqrtPriceNextTick.sub(sqrtPriceCurrent));

        if (amountIn.lte(amountInToBoundary)) {
            // newSqrt = √Pcurrent + Δy/L
            const delta = amountIn.mul(SCALED_ONE).div(L); // scaled Δy/L
            newSqrtPrice = sqrtPriceCurrent.add(delta);

            // Δx = L * (1/√Pnew - 1/√Pcurrent)
            const invCurrent = SCALED_ONE.div(sqrtPriceCurrent);
            const invNew = SCALED_ONE.div(newSqrtPrice);
            amountOut = L.mul(invNew.sub(invCurrent)).div(SCALED_ONE);
        } else {
            // full boundary case
            newSqrtPrice = sqrtPriceNextTick;
            const invCurrent = SCALED_ONE.div(sqrtPriceCurrent);
            const invEnd = SCALED_ONE.div(sqrtPriceNextTick);
            amountOut = L.mul(invEnd.sub(invCurrent)).div(SCALED_ONE);
        }
    }

    return { amountOut, newSqrtPrice };
}
