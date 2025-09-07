import { addAbortListener } from 'events';
import { Pool, IEdge, IAdjList, IEdgeWithWeight } from './interfaces.js'

type ISeen = Record<string, boolean>;
interface IDistance extends Pool {
    w: number; // -log(rate)
}

export const findBestSwapPath = (
    pools: Pool[],
    from: string,
    to: string,
    amountIn: number
): { path: string[]; amountOut: number } | null => {
    const { edges, nodes } = buildAdjacneyList(pools);
    console.log({ edges, nodes })
    const path = getPath(edges, nodes);
    return {
        path,
        amountOut: 0
    }
}

export const getPath = (
    edges: IAdjList,
    assets: string[],
    EPS = 1e-12,
): string[] => {
    const distances: Record<string, number> = {};
    assets.forEach((asset) => {
        distances[asset] = 0;
    });

    const relaxationSteps = assets.length - 1;
    const path = relaxEdges(edges, relaxationSteps, distances, EPS);

    // final check for arbitrage?

    return path;
};

const relaxEdges = (
    edges: IEdgeWithWeight[],
    relaxationSteps: number,
    distances: Record<string, number>,
    EPS: number,
): string[] => {
    const path: string[] = [];
    let shouldContinue: boolean = true;
    for (let i = 0; i <= relaxationSteps && shouldContinue; i++) {
        for (let edge of edges) {
            const { weight } = edge;
            const u = edge.from;
            const v = edge.to;
            if (distances[v] > distances[u] + weight + EPS) {
                distances[v] = weight + distances[u];
            }
        }
    }
    console.log({ distances })
    return path;
};


export const buildAdjacneyList = (pools: Pool[]): { edges: IAdjList, nodes: string[] } => {
    const edges: IAdjList = [];
    const seen: Record<string, boolean> = {};
    const nodes: string[] = [];
    pools.forEach((pool) => {
        addToAdjList(pool, 'tokenA', edges);
        addToAdjList(pool, 'tokenB', edges);
        if (!seen[pool.tokenA]) {
            nodes.push(pool.tokenA);
            seen[pool.tokenA] = true;
        }
        if (!seen[pool.tokenB]) {
            nodes.push(pool.tokenB);
            seen[pool.tokenB] = true;
        }

    })
    return {
        edges,
        nodes
    };
}

const addToAdjList = (pool: Pool, fromParam: 'tokenA' | 'tokenB', list: IAdjList) => {
    const from = pool[fromParam];
    const toParam = fromParam === 'tokenA' ? 'tokenB' : 'tokenA';
    let weight: number;
    if (fromParam === 'tokenA') {
        weight = - Math.log(pool.rate);
    } else {
        weight = - Math.log(1 / pool.rate);
    }
    list.push(
        {
            to: pool[toParam],
            from,
            weight,
            rate: pool.rate
        }
    )

}
