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
    const maxAmountOut = getAmountOutCLMM(L, sqrtPriceCurrent, sqrtPriceNextTick, zeroForOne);

    // console.log({ newPrice, newPriceSqrt: Math.sqrt(newPrice)});
    return {
        amountOut,
        newSqrtPrice: 0,
    }
}