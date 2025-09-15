import { IVwapTrade } from "./interfaces.js";

export class VWAP {
    window: number = 0;
    trades: IVwapTrade[] = []; // sorted by timestamp desc;
    tradesTree = new BSTVwap();
    constructor(window: number) {
        this.window = window;
    }
    public addTrade(trade: IVwapTrade) {
        this.tradesTree.addTrade(trade);
        // console.log(this.tradesTree)
    }

    public getVWAP(fromTimestamp: number) {
        const start = fromTimestamp - this.window;
        const end = fromTimestamp;

        return this.tradesTree.getVwap(start, end);
    }
}

class BSTVwap {
    root: Node | undefined;

    public getVwap(start: number, end: number) {
        const summedNodes = this.getTradesInWindow(start, end);

        if (!summedNodes) return 0;
        return summedNodes.sumPriceQty / summedNodes.sumQty
    }


    public getTradesInWindow(start: number, end: number, currNode: Node | undefined | null = this.root): { sumPriceQty: number, sumQty: number } {
        if (!currNode) return { sumPriceQty: 0, sumQty: 0 };

        // Case 1: entire subtree inside
        if (start <= currNode.minTimestamp && currNode.maxTimestamp <= end) {
            return { sumPriceQty: currNode.sumPriceQty, sumQty: currNode.sumQty };
        }

        // Case 2: entire subtree outside
        if (currNode.maxTimestamp < start || currNode.minTimestamp > end) {
            return { sumPriceQty: 0, sumQty: 0 };
        }

        // Case 3: partial overlap — recurse
        let sumPriceQty = 0;
        let sumQty = 0;

        // include this node if it’s inside the range
        if (start <= currNode.timestamp && currNode.timestamp <= end) {
            sumPriceQty += currNode.price * currNode.qty;
            sumQty += currNode.qty;
        }

        const leftAgg = this.getTradesInWindow(start, end, currNode.left);
        const rightAgg = this.getTradesInWindow(start, end, currNode.right);

        sumPriceQty += leftAgg.sumPriceQty + rightAgg.sumPriceQty;
        sumQty += leftAgg.sumQty + rightAgg.sumQty;

        return { sumPriceQty, sumQty };
    }

    public nodeInWindow(start: number, end: number, node: Node): boolean {
        return start <= node.minTimestamp && node.maxTimestamp <= end;
    }

    public addTrade(trade: IVwapTrade, start: Node | undefined | null = this.root) {
        if (trade.quantity === 0) {
            return;
        }
        const newNode = new Node(trade.timestamp, trade.price, trade.quantity, null);
        if (!this.root) {
            this.root = newNode;
            this.root.updateAggregates()
            return;
        } else {
            if (start) {
                const goLeft = trade.timestamp < start.timestamp;
                if (goLeft) {
                    const { left } = start;
                    if (!left) {
                        newNode.parent = start;
                        start.addLeft(newNode);
                    } else {
                        this.addTrade(trade, start.left)
                    }
                } else {
                    // go right
                    const { right } = start;
                    if (!right) {
                        newNode.parent = start;
                        start.addRight(newNode);
                    } else {
                        this.addTrade(trade, start.right)
                    }
                }
            }
        }
    }
}


class Node {
    timestamp: number;
    price: number;
    qty: number;

    left: Node | null = null;
    right: Node | null = null;
    parent: Node | null = null;

    // Subtree aggregates
    sumPriceQty: number; // Σ (price × qty) in this subtree
    sumQty: number;      // Σ qty in this subtree

    // bounds of subtree
    minTimestamp: number = -Infinity;
    maxTimestamp: number = Infinity;

    constructor(timestamp: number, price: number, qty: number, parent: Node | null) {
        this.timestamp = timestamp;
        this.price = price;
        this.qty = qty;
        this.sumPriceQty = price * qty;
        this.sumQty = qty;
        this.parent = parent;
        this.minTimestamp = timestamp;
        this.maxTimestamp = timestamp;
    }

    public addLeft(newNode: Node) {
        this.left = newNode;
        this.updateAggregates();
        let nodeToUpdate = this.parent;
        while (nodeToUpdate) {
            nodeToUpdate.updateAggregates();
            nodeToUpdate = nodeToUpdate.parent;
        }
    }
    public addRight(newNode: Node) {
        this.right = newNode;
        this.updateAggregates();
        let nodeToUpdate = this.parent;
        while (nodeToUpdate) {
            nodeToUpdate.updateAggregates();
            nodeToUpdate = nodeToUpdate.parent;
        }
    }

    public updateAggregates() {
        this.sumPriceQty = this.price * this.qty;
        this.sumQty = this.qty;

        if (this.left) {
            this.sumPriceQty += this.left.sumPriceQty;
            this.sumQty += this.left.sumQty;
            this.minTimestamp = Math.min(this.minTimestamp, this.left.minTimestamp);
            this.maxTimestamp = Math.max(this.maxTimestamp, this.left.maxTimestamp);
        }
        if (this.right) {
            this.sumPriceQty += this.right.sumPriceQty;
            this.sumQty += this.right.sumQty;
            this.minTimestamp = Math.min(this.minTimestamp, this.right.minTimestamp);
            this.maxTimestamp = Math.max(this.maxTimestamp, this.right.maxTimestamp);
        }
    }
}