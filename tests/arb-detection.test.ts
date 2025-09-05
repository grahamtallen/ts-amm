import { strict as assert } from "assert";
// --- Arbitrage Tests (Uniswap-style) ---

const detectArbitrage = (edges: IEdge[], assets: string[]): boolean => {

    const distances: Record<string, number> = {};
    assets.map(asset => {
        distances[asset] = 0;
    })

    const relaxationSteps = assets.length - 1;
    const updateDistance = (v: string, weight: number) => {
        distances[v] = weight;
        return true;
    }
    relaxEdges(edges, relaxationSteps, updateDistance, distances);

    // final check for arbitrage;
    let result = false;
    const foundArbitrage = (_1: string, _2: number) => {
        result = true;
        return false;
    }
    relaxEdges(edges, 0, foundArbitrage, distances);

    return result;
}

const relaxEdges = (edges: IEdge[], relaxationSteps: number, callback: (v: string, weight: number) => boolean, distances: Record<string, number>) => {
    let shouldContinue: boolean = true;
    for (let i = 0; i <= relaxationSteps; i++) {
        if (!shouldContinue) break;
        for (let edge of edges) {
            const weight = - Math.log(edge.rate);
            const u = edge.from;
            const v = edge.to;
            if (distances[v] > distances[u] + weight) {
                shouldContinue = callback(v, weight + distances[u])
                if (!shouldContinue) break;
            }
        }
    }
}

interface IEdge {
    from: string;
    to: string;
    rate: number;
}
describe("Arbitrage detection", () => {
    it('simple cycle', () => {
        const assets = ["USD", "EUR", "GBP"];
        const edges: IEdge[] = [
            { from: "USD", to: "EUR", rate: 0.9 },
            { from: "EUR", to: "GBP", rate: 0.8 },
            { from: "GBP", to: "USD", rate: 1.5 },
        ];
        // USD → EUR → GBP → USD
        // 1 → 0.9 → 0.72 → 1.08 (>1)
        assert(detectArbitrage(edges, assets));
        // Expected: true
    })
    it('No arbitrages cycle', () => {
        // 2. No arbitrage cycle
        const assets = ["USD", "EUR", "GBP"];
        const edges: IEdge[] = [
            { from: "USD", to: "EUR", rate: 0.9 },
            { from: "EUR", to: "GBP", rate: 0.8 },
            { from: "GBP", to: "USD", rate: 1.3 },
        ];
        // USD → EUR → GBP → USD
        // 1 → 0.9 → 0.72 → 0.936 (<1)
        assert(!detectArbitrage(edges, assets));
        // Expected: false
    })
    it('Multi-hop arbitrage across 4 assets', () => {
        // 
        const assets = ["ETH", "DAI", "USDC", "BTC"];
        const edges: IEdge[] = [
            { from: "ETH", to: "DAI", rate: 2000 },
            { from: "DAI", to: "USDC", rate: 1 },
            { from: "USDC", to: "BTC", rate: 0.00005 },
            { from: "BTC", to: "ETH", rate: 25 },
        ];
        // ETH → DAI → USDC → BTC → ETH
        // 1 → 2000 → 2000 → 0.1 → 2.5 (>1)
        assert(detectArbitrage(edges, assets));
        // Expected: true
    })
    it('simple cycle', () => {
        // 4. Disconnected graph (no complete cycle)
        const assets = ["SOL", "USDC", "ETH"];
        const edges: IEdge[] = [
            { from: "SOL", to: "USDC", rate: 20 },
            { from: "USDC", to: "SOL", rate: 0.05 },
        ];
        // ETH has no edges, so no full cycle
        assert(!detectArbitrage(edges, assets));
        // Expected: false
    })
    it('Arbitrage hidden in longer cycle', () => {
        // 5.
        const assets = ["A", "B", "C", "D"];
        const edges: IEdge[] = [
            { from: "A", to: "B", rate: 1 },
            { from: "B", to: "C", rate: 1 },
            { from: "C", to: "D", rate: 1 },
            { from: "D", to: "A", rate: 1.01 },
        ];
        // A → B → C → D → A
        // Product = 1.01 (>1)
        assert(detectArbitrage(edges, assets))
    })
})