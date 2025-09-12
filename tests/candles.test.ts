// // --- CandleAggregator Tests ---
// const agg = new CandleAggregator(60000); // 1 minute
// const base = 1000000;

// agg.addTick({ price: 100, quantity: 1, timestamp: base + 500 });  // open=100
// agg.addTick({ price: 110, quantity: 2, timestamp: base + 1000 }); // high=110
// agg.addTick({ price: 90, quantity: 3, timestamp: base + 2000 });  // low=90
// agg.addTick({ price: 105, quantity: 4, timestamp: base + 3000 }); // close=105

// console.log("Candles", agg.getCandles());
// // Expected: One candle
// { open:100, high:110, low:90, close:105, volume:10 }
