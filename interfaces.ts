export interface IEdge {
    from: string;
    to: string;
    rate: number;
}
export interface IEdgeWithWeight extends IEdge {
    weight: number; // -log(rate)
}

export interface Pool {
    tokenA: string,
    tokenB: string,
    rate: number
}


export type IAdjList = IEdgeWithWeight[] // key is from 
export interface Quote {
    exchange: string;
    amountOut: number;   // expected output
    slippagePct: number; // e.g. 1 = 1%
}
// src/amm/cpmm.ts
export type Amount = bigint; // fixed-point with 9 extra decimals for safety
export interface CpmmPool {
    xReserves: Amount; // token X
    yReserves: Amount; // token Y
    feeBps: Amount;    // e.g., 30 = 0.30%
}