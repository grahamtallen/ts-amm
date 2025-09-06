import { addAbortListener } from 'events';
import { Pool, IEdge, IAdjList } from './interfaces.js'

type ISeen = Record<string, boolean>;
interface IDistance extends Pool {
    w: number; // -log(rate)
}
export const buildAdjacneyList = (pools: Pool[]): IAdjList => {
    const list: IAdjList = {};
    pools.forEach((pool) => {
        addToAdjList(pool, 'tokenA', list);
        addToAdjList(pool, 'tokenB', list);
    })
    return list;
}

const addToAdjList = (pool: Pool, fromParam: 'tokenA' | 'tokenB', list: IAdjList) => {
    const from = pool[fromParam];
    const toParam = fromParam === 'tokenA' ? 'tokenB' : 'tokenA';
    let weight: number;
    if (fromParam === 'tokenA') {
        weight = - Math.log(pool.rate);
    } else {
        weight =  - Math.log(1 / pool.rate);
    }
    if (!list[from]) {
       list[from] = [
         {
            to: pool[toParam],
            from,
            weight,
            rate: pool.rate
         }
       ] 
    } else {
        list[from].push({
            to: pool[toParam],
            rate: pool.rate,
            weight,
            from,
        })
    }

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