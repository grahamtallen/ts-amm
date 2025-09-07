import { Pool, IAdjList, IEdgeWithWeight } from './interfaces.js'

export const findBestSwapPath = (
    pools: Pool[],
    from: string,
    to: string,
    amountIn: number
): { path: string[]; amountOut: number } | null => {
    if (from === to) {
        return {
            amountOut: 0,
            path: []
        };
    }
    const { edges, nodes, poolsMap } = buildAdjacneyList(pools);
    const path = getPath(edges, nodes, from, to);
    if (path.length === 0) {
        return {
            amountOut: 0,
            path
        };
    }
    let amountOut = amountIn;
    for (let i = 0; i < path.length; i++) { // loop 1 over length of path
        const tokenA = path[i];
        const tokenB = path[i + 1];
        if (!tokenB) continue; // todo possible error case;
        const pool = poolsMap[tokenA + '/' + tokenB];
        if (pool) {
            amountOut = pool.rate * amountOut;
        }
    }

    return {
        path,
        amountOut
    }
}

export const getPath = (
    edges: IAdjList,
    assets: string[],
    source: string,
    destination: string,
    EPS = 1e-12,
): string[] => {

    const distances: Record<string, number> = {};
    assets.forEach((asset) => {
        distances[asset] = asset === source ? 0 : Infinity;
    });

    const relaxationSteps = assets.length - 1;
    const { predecessors } = relaxEdges(edges, relaxationSteps, distances, EPS);
    if (distances[destination] === Infinity) return [];

    const path: string[] = [];
    let nextDest = destination;
    let reachedSource = false;
    path.push(nextDest)
    while (!reachedSource && !!nextDest) { // loop 2 O(path distance)
        if (nextDest === source) {
            reachedSource = true;
            continue;
        }
        const nextHop = predecessors[nextDest];
        if (!nextHop) return []; // unreachable destination
        nextDest = nextHop;
        path.unshift(nextHop);
    }

    return path;
};

const relaxEdges = (
    edges: IAdjList,
    relaxationSteps: number,
    distances: Record<string, number>,
    EPS: number,
): {
    predecessors: Record<string, string>,
} => {
    const predecessors: Record<string, string> = {};
    for (let i = 0; i < relaxationSteps; i++) { // loop 3 O(number of assets - 1)
        let distancesUpdated = false;
        for (let edge of edges) {
            const { weight } = edge;
            const u = edge.from;
            const v = edge.to;
            if (distances[v] > distances[u] + weight + EPS) {
                distances[v] = weight + distances[u];
                predecessors[v] = u;
                distancesUpdated = true;
            }
        }
        if (!distancesUpdated) break;
    }
    return {
        predecessors,
    };
};


export const buildAdjacneyList = (pools: Pool[]): { edges: IAdjList, nodes: string[], poolsMap: Record<string, Pool> } => {
    const edges: IAdjList = [];
    const poolsMap: Record<string, Pool> = {}; // key is ETH/USDC, etc
    const seen: Record<string, boolean> = {};
    const nodes: string[] = [];
    pools.forEach((pool) => { // loop 4 over number of pools
        const { tokenA, tokenB } = pool;
        addToAdjList(pool, 'tokenA', edges);
        if (!seen[pool.tokenA]) {
            nodes.push(pool.tokenA);
            seen[pool.tokenA] = true;
        }
        if (!seen[pool.tokenB]) {
            nodes.push(pool.tokenB);
            seen[pool.tokenB] = true;
        }
        poolsMap[tokenA + '/' + tokenB] = pool;

    })
    return {
        edges,
        nodes,
        poolsMap
    };
}

const addToAdjList = (pool: Pool, fromParam: 'tokenA' | 'tokenB', list: IAdjList) => {
    const from = pool[fromParam];
    const toParam = fromParam === 'tokenA' ? 'tokenB' : 'tokenA';
    let weight: number;
    weight = - Math.log(pool.rate);
    list.push(
        {
            to: pool[toParam],
            from,
            weight,
            rate: pool.rate
        }
    )

}
