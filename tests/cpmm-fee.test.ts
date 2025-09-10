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
    });
});
