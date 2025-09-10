import { strict as assert } from "assert";
import { MinHeap } from "../minheap.js";

/**
 * ===========================
 * MinHeap
 * ===========================
 *
 * Functionality under test:
 *   - insert(value: T): void
 *   - extractMin(): T | undefined
 *   - peek(): T | undefined
 *   - size(): number
 *   - isEmpty(): boolean
 */

describe("MinHeap", () => {
    it("starts empty", () => {
        const heap = new MinHeap<number>();
        assert.equal(heap.size(), 0);
        assert.equal(heap.isEmpty(), true);
        assert.equal(heap.peek(), undefined);
        assert.equal(heap.extractMin(), undefined);
    });

    it("inserts a single element", () => {
        const heap = new MinHeap<number>();
        heap.insert(42);
        assert.equal(heap.size(), 1, 'size');
        assert.equal(heap.isEmpty(), false, 'isEmpty');
        assert.equal(heap.peek(), 42, 'peek');
    });

    it("extracts elements in sorted order", () => {
        const heap = new MinHeap<number>();
        heap.insert(5);
        heap.insert(1);
        heap.insert(3);

        assert.equal(heap.size(), 3);
        assert.equal(heap.extractMin(), 1, 'expected 1');
        assert.equal(heap.extractMin(), 3, 'expected 3');
        assert.equal(heap.extractMin(), 5, 'expected 5');
        assert.equal(heap.isEmpty(), true);
    });

    it("maintains heap property with duplicates", () => {
        const heap = new MinHeap<number>();
        heap.insert(2);
        heap.insert(2);
        heap.insert(1);
        heap.insert(3);

        assert.equal(heap.extractMin(), 1);
        assert.equal(heap.extractMin(), 2);
        assert.equal(heap.extractMin(), 2);
        assert.equal(heap.extractMin(), 3);
        assert.equal(heap.extractMin(), undefined);
    });

    it("works with negative numbers", () => {
        const heap = new MinHeap<number>();
        heap.insert(-5);
        heap.insert(10);
        heap.insert(-1);

        assert.equal(heap.extractMin(), -5);
        assert.equal(heap.extractMin(), -1);
        assert.equal(heap.extractMin(), 10);
    });

    it("supports generic types with custom comparator", () => {
        interface User { id: number; name: string }
        const heap = new MinHeap<User>((a: User, b: User) => a.id > b.id);

        heap.insert({ id: 3, name: "Alice" });
        heap.insert({ id: 1, name: "Bob" });
        heap.insert({ id: 2, name: "Charlie" });

        assert.deepEqual(heap.extractMin(), { id: 1, name: "Bob" });
        assert.deepEqual(heap.extractMin(), { id: 2, name: "Charlie" });
        assert.deepEqual(heap.extractMin(), { id: 3, name: "Alice" });
    });
});
