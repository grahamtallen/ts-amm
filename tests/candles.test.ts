import { strict as assert } from 'assert';
import { CandleAggregator } from "../candle.js";

describe('Candlestick aggregator', () => {
    it('returns no candles when no ticks are added', () => {
        const agg = new CandleAggregator(60000, 1_000_000);
        assert.deepEqual(agg.getCandles(), []);
    });

    it('base case', () => {
        // --- CandleAggregator Tests ---
        const base = 1000000;
        const agg = new CandleAggregator(60000, base); // 1 minute

        agg.addTick({ price: 100, quantity: 1, timestamp: base + 500 });  // open=100
        agg.addTick({ price: 110, quantity: 2, timestamp: base + 1000 }); // high=110
        agg.addTick({ price: 90, quantity: 3, timestamp: base + 2000 });  // low=90
        agg.addTick({ price: 105, quantity: 4, timestamp: base + 3000 }); // close=105

        // Expected: One candle
        assert.deepEqual(agg.getCandles(), [{ open: 100, high: 110, low: 90, close: 105, volume: 10 }]);
    })

    it('handles a bucket with only one tick', () => {
        const base = 1_000_000;
        const agg = new CandleAggregator(60000, base);
        agg.addTick({ price: 200, quantity: 7, timestamp: base + 500 });

        assert.deepEqual(agg.getCandles(), [
            { open: 200, high: 200, low: 200, close: 200, volume: 7 }
        ]);
    });


    it('three buckets', () => {
        const base = 1_000_000;
        const agg = new CandleAggregator(60000, base); // 1 minute buckets

        // Minute 0 bucket [1,000,000 → 1,059,999]
        agg.addTick({ price: 100, quantity: 1, timestamp: base + 500 });   // open=100
        agg.addTick({ price: 105, quantity: 2, timestamp: base + 1000 });  // high=105
        agg.addTick({ price: 95, quantity: 3, timestamp: base + 2000 });  // low=95
        agg.addTick({ price: 102, quantity: 4, timestamp: base + 3000 });  // close=102

        // Minute 1 bucket [1,060,000 → 1,119,999]
        agg.addTick({ price: 110, quantity: 1, timestamp: base + 61_000 }); // new candle
        agg.addTick({ price: 120, quantity: 2, timestamp: base + 62_000 }); // high=120
        agg.addTick({ price: 108, quantity: 3, timestamp: base + 63_000 }); // low=108
        agg.addTick({ price: 115, quantity: 4, timestamp: base + 64_000 }); // close=115

        // Minute 2 bucket [1,120,000 → 1,179,999]
        agg.addTick({ price: 130, quantity: 5, timestamp: base + 121_000 }); // open=130, etc.

        const [bucket1, bucket2, bucket3] = agg.getCandles();
        assert.deepEqual(bucket1, { open: 100, high: 105, low: 95, close: 102, volume: 10 });
        assert.deepEqual(bucket2, { open: 110, high: 120, low: 108, close: 115, volume: 10 });
        assert.deepEqual(bucket3, { open: 130, high: 130, low: 130, close: 130, volume: 5 });
    })

    it('correctly separates ticks on bucket boundary', () => {
        const base = 1_000_000;
        const agg = new CandleAggregator(60000, base);

        // falls in first bucket [1,000,000 → 1,059,999]
        agg.addTick({ price: 100, quantity: 1, timestamp: base });

        // falls in second bucket [1,060,000 → 1,119,999]
        agg.addTick({ price: 200, quantity: 2, timestamp: base + 60_000 });

        const [bucket1, bucket2] = agg.getCandles();
        assert.deepEqual(bucket1, { open: 100, high: 100, low: 100, close: 100, volume: 1 });
        assert.deepEqual(bucket2, { open: 200, high: 200, low: 200, close: 200, volume: 2 });
    });

    it('processes ticks out of order consistently', () => {
        const base = 1_000_000;
        const agg = new CandleAggregator(60000, base);

        agg.addTick({ price: 105, quantity: 1, timestamp: base + 5000 });
        agg.addTick({ price: 100, quantity: 2, timestamp: base + 1000 }); // earlier tick

        const [bucket] = agg.getCandles();
        assert.deepEqual(bucket, { open: 100, high: 105, low: 100, close: 105, volume: 3 });
    });

    it('sums volume correctly over many ticks', () => {
        const base = 1_000_000;
        const agg = new CandleAggregator(60000, base);

        for (let i = 0; i < 100; i++) {
            agg.addTick({ price: 50 + i, quantity: 1, timestamp: base + i * 500 });
        }

        const [bucket] = agg.getCandles();
        assert.equal(bucket?.volume, 100); // 100 trades of quantity=1
    });


})
