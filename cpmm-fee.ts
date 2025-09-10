import { Amount, CpmmPool } from "./interfaces.js"

export const getAmountOutCPMM = (dx: Amount, pool: CpmmPool): Amount => {
    const { xReserves, yReserves, feeBps } = pool;
    const dxEffective = getDxEffective(dx, feeBps)


    const numerator = dxEffective * yReserves
    const denominator = xReserves + dxEffective;
    return numerator / denominator;
}

export const getDxEffective = (dx: Amount, feeBps: Amount, scale: Amount = 1000n) => {
    const multiplier = scale - feeBps; // 970
    return (dx * multiplier) / scale;
}