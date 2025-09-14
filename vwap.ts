import { IVwapTrade } from "./interfaces.js";

export class VWAP {
    window: number = 0;
    trades: IVwapTrade[] = []; // sorted by timestamp desc;
    constructor(window: number) {
        this.window = window;
    }
    public addTrade(trade: IVwapTrade) {
        if (this.trades.length === 0) {
            this.trades.push(trade);
            return;
        }
        const lastTrade = this.trades[this.trades.length - 1];
        if (trade.timestamp > lastTrade.timestamp) {
            this.trades.push(trade);
            return;
        }
        for (let i = this.trades.length - 1; i >= 0; i--) {
            const internalTrade = this.trades[i];
            if (internalTrade.timestamp > trade.timestamp) {
                this.trades.splice(i, 0, trade);
            }
        }
    }

    public getVWAP(fromTimestamp: number) {
        const start = fromTimestamp - this.window;
        const end = fromTimestamp;
        const vwapCalc = new VWAPCalculator(start, end);
        for (let i = this.trades.length - 1; i >= 0; i--) {
            const trade = this.trades[i];
            if (end >= trade.timestamp && trade.timestamp >= start) {
                vwapCalc.addTrade(trade);
            } else if (trade.timestamp < start) {
                break;
            }
        }
        return vwapCalc.calcVWAP();
    }
}

export class VWAPCalculator {
    start: number = 0;
    end: number = 0;
    private numerator: number = 0;
    private denominator: number = 0;
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }

    public addTrade(trade: IVwapTrade) {
        if (this.start <= trade.timestamp && trade.timestamp <= this.end) {
            this.numerator += trade.price * trade.quantity;
            this.denominator += trade.quantity;
        }
    }

    public calcVWAP() {
        return this.numerator / this.denominator;
    }
}

