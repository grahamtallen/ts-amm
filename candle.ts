import { ICandle, ICandleTick } from "./interfaces.js";

export class CandleAggregator {
    public start: number;
    public range: number;
    public buckets: Bucket[] = [];
    constructor(range: number, start: number) {
        this.start = start;
        this.range = range;
    }
    public addTick = (tick: ICandleTick): void => {
        const bucketIndex = this.getBucketFromTimestamp(tick.timestamp);
        if (!this.buckets[bucketIndex]) {
            this.buckets[bucketIndex] = new Bucket();
        }
        this.buckets[bucketIndex].addTick(tick);
    }

    public getCandles = (): ICandle[] => {
        return this.buckets.map(b => b.getCandle());
    }

    public getBucketFromTimestamp = (timestamp: number): number => {
        const timePassed = timestamp - this.start;
        if (timePassed <= this.range) {
            return 0;
        } else {
            return Math.floor(timePassed / this.range);
        };
    }
}

export class Bucket implements ICandle {
    ticks: ICandleTick[] = [];
    open: number = 0;
    high: number = 0;
    low: number = 0;
    close: number = 0;
    volume: number = 0;

    public getCandle = (): ICandle => {
        return {
            high: this.high,
            low: this.low,
            close: this.close,
            open: this.open,
            volume: this.volume
        }
    }

    public addTick = (tick: ICandleTick) => {
        if (this.ticks.length === 0) {
            this.open = tick.price;
        }
        const { price, quantity } = tick;
        const { high, low, volume } = this;
        if (!quantity) return;
        if (price > high) {
            this.high = price;
        }
        if (low === 0 || price < low) {
            this.low = price;
        }
        this.volume += quantity;
        this.close = tick.price;
        this.ticks.push(tick);

    }
}