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