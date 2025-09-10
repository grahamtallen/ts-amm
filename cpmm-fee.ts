import { Amount, CpmmPool } from "./interfaces.js"

export const getAmountOutCPMM = (dx: Amount, pool: CpmmPool): Amount => {
    const { xReserves, yReserves, feeBps } = pool;
    const scale = 1000n;
    const multiplier = scaleFee(feeBps, scale); // 970
    const dxEffective = (dx * multiplier) / scale;

    const numerator = dxEffective * yReserves
    const denominator = xReserves + dxEffective;
    return numerator / denominator;
}

export const scaleFee = (feeBps: Amount, scale: bigint) => {
    return scale - feeBps;
}