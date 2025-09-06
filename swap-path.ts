import { addAbortListener } from 'events';
import { Pool, IEdge, IAdjList } from './interfaces.js'

type ISeen = Record<string, boolean>;
interface IDistance extends Pool {
    w: number; // -log(rate)
}
const  buildAdjacneyList = (pools: Pool[]) => {
    const list: IAdjList = {};
    pools.forEach((pool) => {
        const { tokenA, tokenB } = pool;
        addToAdjList(pool, 'A');
        addToAdjList(pool, 'B');
    })
}

const addToAdjList = (pool: Pool, token: 'A' | 'B') => {

}

/*
const getLowest = (seen: ISeen, distances: IDistance[]): string => {
    let lowestIndex = -1;
    let lowestDistance = Infinity;
    for (let i = 0; i < distances.length; i++) {
        const dist = distances[i];
        if (seen[dist.])

    }

}
    */