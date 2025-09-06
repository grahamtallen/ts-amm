import { strict as assert } from 'assert';
import { Median } from '../median.js';
describe('median calc - interpolated percentile', () => {

	it('odd # of prices', () => {
		const prices: number[] = [10, 30, 50, 20, 40];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		})
		const result = median.getMedian();
		assert.equal(result, 30);
	})

	it("single price", () => {
		const prices: number[] = [42];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		assert.equal(result, 42);
	});

	it("two prices", () => {
		const prices: number[] = [50, 40];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// average of 10 and 20
		assert.equal(result, 45);
	});

	it("odd # of prices", () => {
		const prices: number[] = [10, 30, 50, 20, 40];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [10,20,30,40,50], middle = 30
		assert.equal(result, 30);
	});

	it("even # of prices", () => {
		const prices: number[] = [5, 50, 20, 10];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [5,10,20,50], middle two = 10,20 → (10+20)/2 = 15
		assert.equal(result, 15);
	});

	it("with duplicates", () => {
		const prices: number[] = [10, 10, 10, 20, 30];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [10,10,10,20,30], middle = 10
		assert.equal(result, 10);
	});

	it("negative numbers included", () => {
		const prices: number[] = [-10, -5, 0, 5, 10];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [-10,-5,0,5,10], middle = 0
		assert.equal(result, 0);
	});

	it("larger even list", () => {
		const prices: number[] = [100, 200, 300, 400, 500, 600];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [100,200,300,400,500,600], middle two = 300,400 → 350
		assert.equal(result, 350);
	});

	it("interleaved inserts", () => {
		const prices: number[] = [100, 50, 200, 300];
		const median = new Median();
		prices.forEach((price) => {
			median.addPrice(price);
		});
		const result = median.getMedian();
		// sorted: [50,100,200,300], middle two = 100,200 → 150
		assert.equal(result, 150);
	});
});
