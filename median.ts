
interface IMedianLocation {
    low: number;
    high?: number; // only present if even number of inserts
}

export class Median {
    private prices: number[] = [];
    private median?: number;

    public addPrice(price: number): boolean { // return value is only for debugging, indicates a failure if false
        if (this.prices.length === 0) {
            this.prices.push(price);
            this.median = price;
            return true;
        }
        let priceAdded = false;
        // when price is added, compare it to each price until you find a price higher than the added one

        for (let i = 0; i < this.prices.length; i++) {
            const current = this.prices[i];
            if (current >= price) {
                const targetIndexForNewPrice = i;
                const medianLocation = this.addPriceAtIndex(price, targetIndexForNewPrice);
                this.setMedian(medianLocation);
                priceAdded = true;
                break;
            }
        }
        // if you don't find a higher value, add it to the end of the array
        if (!priceAdded) {
            const medianLocation = this.addPriceAtIndex(price, this.prices.length - 1);
            this.setMedian(medianLocation);
            priceAdded = true;
        }
        return priceAdded;
    }

    public getMedian(): number | undefined {
        return this.median
    }

    public setMedian(location: IMedianLocation): void {
        console.log({
            prices: this.prices,
            location,
        })
        if (!location.high) {
            this.median = location.low;
        } else {
            this.median = (location.low + location.high) / 2;
        }
    }

    private addPriceAtIndex(newPrice: number, index: number): IMedianLocation {
        const firstHalf = this.prices.slice(0, index);
        const secondHalf = this.prices.splice(index, this.prices.length);
        this.prices = firstHalf.concat(newPrice).concat(secondHalf);
        const { length } = this.prices;
        if (length % 2 == 0) {
            // even case
            const lowIndex = length / 2;
            const highIndex = length / 2 + 1;
            return {
                low: this.prices[lowIndex],
                high: this.prices[highIndex],
            }
        } else {
            const lowIndex = Math.floor(length / 2);
            return {
                low: this.prices[lowIndex]
            }
        }
    }


}
