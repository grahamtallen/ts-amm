export function getAmountOutCPMM(xIn: number, xReserves: number, yReserves: number): number {
    // x * y = k;
    // so delta y = k / (xReserves + x)
    //      */
    // function price(uint256 xInput, uint256 xReserves, uint256 yReserves) public pure returns (uint256 yOutput) {
    //     // fee
    //     uint256 xInputWithFee = xInput * 997;
    //     // Constant product formula
    //     uint256 numerator = xInputWithFee * yReserves;
    //     uint256 denominator = xReserves * 1000 + xInputWithFee;

    //     return numerator / denominator;
    // }
    const numerator = xIn * yReserves;
    const denominator = xReserves + xIn;
    return numerator / denominator;
}

/*
 * Hint: use formulas:
 *   - if zeroForOne: Δy = L * (sqrtPriceStart - sqrtPriceEnd)
 *   - if oneForZero: Δx = L * (1/sqrtPriceEnd - 1/sqrtPriceStart)
 */


export function getAmountOutCLMM(
    L: number,
    sqrtPriceStart: number,
    sqrtPriceEnd: number,
    zeroForOne: boolean
): number {
    let result: number;
    if (zeroForOne) {
        result = L * (sqrtPriceStart - sqrtPriceEnd);
    } else {
        result = L * ((1 / sqrtPriceEnd - 1 / sqrtPriceStart))
    }
    return Math.abs(result);
}


export function crossTick(
    L: number,
    sqrtPriceCurrent: number,
    sqrtPriceNextTick: number,
    zeroForOne: boolean,
    amountIn: number
): { amountOut: number, newSqrtPrice: number } {
    // check inputs are correct, price moves in expected direction
    if (zeroForOne) {
        if (sqrtPriceCurrent <= sqrtPriceNextTick) {
            throw new Error('Invalid input');
        }
    } else {
        if (sqrtPriceCurrent >= sqrtPriceNextTick) {
            throw new Error('Invalid input');
        }
    }
    let amountOut: number = 0;
    let newSqrtPrice: number = 0;
    if (zeroForOne) {
        const amountInToBoundary = L * (sqrtPriceCurrent - sqrtPriceNextTick) / (sqrtPriceCurrent * sqrtPriceNextTick);
        if (amountIn <= amountInToBoundary) {
            newSqrtPrice = 1 / (1 / sqrtPriceCurrent + amountIn / L);
            amountOut = L * (sqrtPriceCurrent - newSqrtPrice);
        }
    } else {
        const amountInToBoundary = L * (sqrtPriceNextTick - sqrtPriceCurrent);
        if (amountIn <= amountInToBoundary) {
            newSqrtPrice = sqrtPriceCurrent + (amountIn / L);
            amountOut = L * ((1 / sqrtPriceCurrent) - (1 / newSqrtPrice));
        }
    }
    return {
        amountOut,
        newSqrtPrice,
    }
}