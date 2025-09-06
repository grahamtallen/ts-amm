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


export type IAdjList =  Record<string, IEdgeWithWeight[]> // key is from 