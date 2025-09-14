import { IVwapTrade } from "./interfaces.js";

export class VWAP {
    private window: number = 0;
    private numerator: number = 0;
    private denominator: number = 0;
    constructor(window: number) {
        this.window = window;
    }

    public addTrade(trade: IVwapTrade) {
        this.numerator += trade.price * trade.quantity;
        this.denominator += trade.quantity;
    }

    public getVWAP(timestamp: number) {
        return this.numerator / this.denominator;
    }
}