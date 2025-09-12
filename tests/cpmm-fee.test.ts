import { getAmountOutCPMM } from "../cpmm-fee.js";
import { strict as assert } from 'assert';
import { CpmmPool } from "../interfaces.js";

describe("CPMM amountOut", () => {
    it("small swap respects fee and curvature", () => {
        const pool: CpmmPool = {
            xReserves: 1_000_000_000_000n,
            yReserves: 1_000_000_000_000n,
            feeBps: 30n,
        };
        const dx = 1_000_000n; // 1e6 "atomic units"
        const out = getAmountOutCPMM(dx, pool);
        assert(out > 0n, 'Amount out is correct');
        // sanity: with fee>0, output < no-fee baseline
        const noFee = getAmountOutCPMM(dx, { ...pool, feeBps: 0n });
        assert(out < noFee, ' out is greater than nofee');
        assert.equal(noFee, 999999n, 'amount is expected')
    });
    it("zero input produces zero output", () => {
        const pool: CpmmPool = { xReserves: 1_000_000n, yReserves: 1_000_000n, feeBps: 30n };
        const out = getAmountOutCPMM(0n, pool);
        assert.equal(out, 0n);
    });
    it("fee = 0 matches baseline constant product formula", () => {
        const pool: CpmmPool = { xReserves: 1_000_000n, yReserves: 2_000_000n, feeBps: 0n };
        const dx = 123_456n;
        const out = getAmountOutCPMM(dx, pool);

        // manual constant product (no fee)
        const dy = (dx * pool.yReserves) / (pool.xReserves + dx);
        assert.equal(out, dy);
    });

    it("100% fee results in no output", () => {
        const pool: CpmmPool = { xReserves: 10_000n, yReserves: 10_000n, feeBps: 1000n }; // if scale=1000n
        const dx = 1_000n;
        const out = getAmountOutCPMM(dx, pool);
        assert.equal(out, 0n);
    });

    it("symmetric pool small swap gives nearly 1:1", () => {
        const pool: CpmmPool = { xReserves: 1_000_000n, yReserves: 1_000_000n, feeBps: 10n };
        const dx = 100n;
        const out = getAmountOutCPMM(dx, pool);
        assert(out < dx && out > dx / 2n);
    });

    it("tiny swap underflows to zero effective input", () => {
        const pool: CpmmPool = { xReserves: 1_000_000n, yReserves: 1_000_000n, feeBps: 1n };
        const dx = 1n; // smallest possible
        const out = getAmountOutCPMM(dx, pool);
        assert.equal(out, 0n);
    });

    it("larger input yields larger output", () => {
        const pool: CpmmPool = { xReserves: 1_000_000n, yReserves: 1_000_000n, feeBps: 30n };
        const dx1 = 1000n;
        const dx2 = 2000n;
        const out1 = getAmountOutCPMM(dx1, pool);
        const out2 = getAmountOutCPMM(dx2, pool);
        assert(out2 > out1);
    });

    it.skip("works with highly imbalanced reserves", () => {
        const pool: CpmmPool = { xReserves: 1_000_000_000n, yReserves: 1_000n, feeBps: 30n };
        const dx = 1_000n;
        const out = getAmountOutCPMM(dx, pool);
        assert(out > 0n, 'out is greater than zero');
        assert(out < pool.yReserves, ' out is greater than pool reserves');
    });





});
