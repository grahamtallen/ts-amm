export interface IEdge {
    from: string;
    to: string;
    rate: number;
}
export interface IEdgeWithWeight extends IEdge {
    weight: number; // -log(rate)
}