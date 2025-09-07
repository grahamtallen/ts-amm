import { stringify } from 'querystring';
import { Pool, IEdge, IAdjList, IEdgeWithWeight } from './interfaces.js'

export const findBestSwapPath = (
    pools: Pool[],
    from: string,
    to: string,
    amountIn: number
): { path: string[]; amountOut: number } | null => {
    const { edges, nodes, poolsMap } = buildAdjacneyList(pools);
    console.log({ edges, nodes })
    const path = getPath(edges, nodes, from, to);
    let amountOut = 0;
    let newAmountIn = amountIn;
    for (let i = 0; i < path.length; i++) {
        const tokenA = path[i];
        const tokenB = path[i + 1];
        if (!tokenB) continue; // todo possible error case;
        const pool = poolsMap[tokenA + '/' + tokenB];
        if (pool) {
            amountOut = amountOut + pool.rate * newAmountIn;
            newAmountIn = amountOut;
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

    console.log({ predecessors, distances });
    const path: string[] = [];
    let nextDest = destination;
    let reachedSource = false;
    path.push(nextDest)
    while (!reachedSource && !!nextDest) {
        if (nextDest === source) {
            reachedSource = true;
            continue;
        }
        const nextHop = predecessors[nextDest];
        delete predecessors[nextDest];
        nextDest = nextHop;
        path.unshift(nextHop);
    }

    // final check for arbitrage?

    return path;
};

const relaxEdges = (
    edges: IEdgeWithWeight[],
    relaxationSteps: number,
    distances: Record<string, number>,
    EPS: number,
): {
    predecessors: Record<string, string>,
} => {
    const predecessors: Record<string, string> = {};
    for (let i = 0; i < relaxationSteps; i++) {
        for (let edge of edges) {
            const { weight } = edge;
            const u = edge.from;
            const v = edge.to;
            if (distances[v] > distances[u] + weight + EPS) {
                distances[v] = weight + distances[u];
                predecessors[v] = u;
            }
        }
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
    pools.forEach((pool) => {
        const { tokenA, tokenB } = pool;
        addToAdjList(pool, 'tokenA', edges);
        // addToAdjList(pool, 'tokenB', edges);
        if (!seen[pool.tokenA]) {
            nodes.push(pool.tokenA);
            seen[pool.tokenA] = true;
        }
        if (!seen[pool.tokenB]) {
            nodes.push(pool.tokenB);
            seen[pool.tokenB] = true;
        }
        poolsMap[tokenA + '/' + tokenB] = pool;
        // const inverseRate = 1 / pool.rate;
        // poolsMap[tokenB + '/' + tokenA] = {
        //     ...pool,
        //     rate: inverseRate
        // };

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
    // if (fromParam === 'tokenA') {
    weight = - Math.log(pool.rate);
    // } else {
    //     weight = Math.log(pool.rate);
    // }
    list.push(
        {
            to: pool[toParam],
            from,
            weight,
            rate: pool.rate
        }
    )

}
