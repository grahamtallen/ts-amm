import { strict as assert } from 'assert';
import { Pool, IEdge, IAdjList } from '../interfaces.js'
import { buildAdjacneyList, findBestSwapPath } from '../swap-path.js';



describe("Utitlties", () => {
    it.only('buildAdjacencyList', () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
            { tokenA: "USDC", tokenB: "DAI", rate: 1.05 },
            { tokenA: "DAI", tokenB: "WBTC", rate: 0.0005 },
            { tokenA: "ETH", tokenB: "WBTC", rate: 0.9 }, // direct but worse
        ];
        const { edges, nodes } = buildAdjacneyList(pools);
        assert.deepEqual(nodes, ['ETH', 'USDC', 'DAI', 'WBTC']);
        assert.equal(edges.length, 8);
    })
})

describe.skip("findBestSwapPath - Edge Cases", () => {
    it.skip("returns null if from and to token are the same with no direct pool", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
        ];
        const result = findBestSwapPath(pools, "ETH", "ETH", 1);
        assert.equal(result, null);
    });

    it("handles a direct pool with 1:1 rate correctly", () => {
        const pools: Pool[] = [
            { tokenA: "DAI", tokenB: "USDC", rate: 1 },
        ];
        const result = findBestSwapPath(pools, "DAI", "USDC", 100);
        assert.equal(result?.path, ["DAI", "USDC"]);
        assert.equal(result?.amountOut, 100);
    });

    it("chooses the better of two direct pools", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
            { tokenA: "ETH", tokenB: "USDC", rate: 2100 },
        ];
        const result = findBestSwapPath(pools, "ETH", "USDC", 1);
        assert.equal(result?.path, ["ETH", "USDC"]);
        assert.equal(result?.amountOut, 2100);
    });

    it("avoids paths with zero or unusable rates", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 0 },      // bad pool
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },   // good pool
        ];
        const result = findBestSwapPath(pools, "ETH", "USDC", 1);
        assert.equal(result?.amountOut, 2000);
    });

    it("finds the best path even when a longer route is more profitable", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
            { tokenA: "USDC", tokenB: "DAI", rate: 1.05 },
            { tokenA: "DAI", tokenB: "WBTC", rate: 0.0005 },
            { tokenA: "ETH", tokenB: "WBTC", rate: 0.9 }, // direct but worse
        ];
        // ETH → USDC → DAI → WBTC = 2000 * 1.05 * 0.0005 = 1.05 WBTC
        // ETH → WBTC direct = 0.9 WBTC
        const result = findBestSwapPath(pools, "ETH", "WBTC", 1);
        assert.equal(result?.path, ["ETH", "USDC", "DAI", "WBTC"]);
        assert.equal(result?.amountOut, 1.05);
    });

    it("returns null if no possible path exists", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
            { tokenA: "WBTC", tokenB: "DAI", rate: 20000 },
        ];
        const result = findBestSwapPath(pools, "ETH", "WBTC", 1);
        assert.equal(result, null);
    });

    it("handles a cycle in the graph without infinite loops", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
            { tokenA: "USDC", tokenB: "ETH", rate: 1 / 2000 }, // cycle
            { tokenA: "USDC", tokenB: "DAI", rate: 1.01 },
        ];
        // ETH → USDC → DAI beats ETH → USDC → ETH → ...
        const result = findBestSwapPath(pools, "ETH", "DAI", 1);
        assert.equal(result?.path, ["ETH", "USDC", "DAI"]);
        assert.equal(result?.amountOut, 2000 * 1.01);
    });

    it("handles very large input amounts safely", () => {
        const pools: Pool[] = [
            { tokenA: "ETH", tokenB: "USDC", rate: 2000 },
        ];
        const result = findBestSwapPath(pools, "ETH", "USDC", 10 ** 6);
        assert.equal(result?.amountOut, 2_000_000_000);
    });
});
