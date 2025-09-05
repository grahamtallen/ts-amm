import { strict as assert } from "assert";
import { log } from "console";
// --- Arbitrage Tests (Uniswap-style) ---

const detectArbitrage = (
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

interface IEdge {
    from: string;
    to: string;
    rate: number;
}
interface IEdgeWithWeight extends IEdge {
    weight: number; // -log(rate)
}
describe("Arbitrage detection", () => {
    it("simple cycle", () => {
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
    });
    it("No arbitrages cycle", () => {
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
    });
    it("Multi-hop arbitrage across 4 assets", () => {
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
    });
    it("simple cycle", () => {
        // 4. Disconnected graph (no complete cycle)
        const assets = ["SOL", "USDC", "ETH"];
        const edges: IEdge[] = [
            { from: "SOL", to: "USDC", rate: 20 },
            { from: "USDC", to: "SOL", rate: 0.05 },
        ];
        // ETH has no edges, so no full cycle
        assert(!detectArbitrage(edges, assets));
        // Expected: false
    });
    it("Arbitrage hidden in longer cycle", () => {
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
        assert(detectArbitrage(edges, assets));
    });
    it("Known failure case without accounting for fp drift", () => {
        const assets: string[] = ["A0", "A1", "A2", "A3", "A4"];
        const edges: IEdge[] = [
            { from: "A0", to: "A1", rate: 8.942855679669439 },
            { from: "A1", to: "A2", rate: 7.854919914513515 },
            { from: "A2", to: "A3", rate: 6.16598204899797 },
            { from: "A3", to: "A4", rate: 5.455062006905789 },
            { from: "A4", to: "A0", rate: 0.0004232335320697065 },
        ];
        assert(!detectArbitrage(edges, assets, 1e-12));
    });

    it.skip("Stress test: hunt for false arbitrage due to FP drift", () => {
        const findFalsePositive = () => {
            for (let trial = 0; trial < 1_000_000; trial++) {
                const n = 5; // cycle length
                const assets = Array.from({ length: n }, (_, i) => `A${i}`);
                const edges: IEdge[] = [];

                let product = 1;
                for (let i = 0; i < n - 1; i++) {
                    // random rate between 0.1 and 10
                    const r = Math.random() * 9.9 + 0.1;
                    edges.push({ from: assets[i], to: assets[i + 1], rate: r });
                    product *= r;
                }
                // final edge makes product exactly 1
                edges.push({ from: assets[n - 1], to: assets[0], rate: 1 / product });

                if (detectArbitrage(edges, assets)) {
                    return { trial, edges };
                }
            }
            return null;
        };

        const bad = findFalsePositive();
        if (bad) {
            console.log("False arbitrage detected!", bad);
        } else {
            console.log("No false positives found in 1e6 trials");
        }
    });
});
