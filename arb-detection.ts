import { IEdge, IEdgeWithWeight } from "./interfaces.js";

export const detectArbitrage = (
    edges: IEdge[],
    assets: string[],
    EPS = 1e-12,
): boolean => {
    const distances: Record<string, number> = {};
    assets.forEach((asset) => {
        distances[asset] = 0;
    });

    const relaxationSteps = assets.length - 1;
    const updateDistance = (v: string, weight: number) => {
        distances[v] = weight;
        return true;
    };
    const edgesWithWeight = edges.map((edge) => ({
        weight: -Math.log(edge.rate),
        ...edge
    }))
    relaxEdges(edgesWithWeight, relaxationSteps, updateDistance, distances, EPS);

    // final check for arbitrage;
    let result = false;
    const foundArbitrage = (_1: string, _2: number) => {
        result = true;
        return false;
    };
    relaxEdges(edgesWithWeight, 0, foundArbitrage, distances, EPS);

    return result;
};

const relaxEdges = (
    edges: IEdgeWithWeight[],
    relaxationSteps: number,
    callback: (v: string, weight: number) => boolean,
    distances: Record<string, number>,
    EPS: number,
) => {
    let shouldContinue: boolean = true;
    for (let i = 0; i <= relaxationSteps && shouldContinue; i++) {
        for (let edge of edges) {
            const { weight } = edge;
            const u = edge.from;
            const v = edge.to;
            if (distances[v] > distances[u] + weight + EPS) {
                shouldContinue = callback(v, weight + distances[u]);
                if (!shouldContinue) break;
            }
        }
    }
};