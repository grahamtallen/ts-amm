export class MinHeap<T> {
  public length: number = 0;
  public data: T[] = [];
  greaterThan: (a: T, b: T) => boolean = this.greaterThanDefault;

  constructor(greaterThan?: (a: T, b: T) => boolean) {
    if (!greaterThan) {
        this.greaterThan = this.greaterThanDefault;
    } else {
        this.greaterThan = greaterThan;
    }
  }

  greaterThanDefault(a: T, b: T): boolean {
    if (!!a && !b) {
      return true;
    } else if (!a && !!b) {
      return false;
    }
    return a > b;
  }

  insert(value: T): void {
    this.data[this.length] = value;
    this.heapifyUp(this.length);
    this.length++;
  }
  extractMin(): T | undefined {
    if (this.length === 0) {
      return;
    }
    const out = this.data[0];
    this.length--;
    if (this.length === 0) {
      this.data = [];
      this.length = 0;
      return out;
    }
    const endItem = this.data[this.length];
    this.data[0] = endItem;
    this.data.pop();
    this.heapifyDown(0);
    return out;
  }
  peek(): T | undefined {
    return this.data[0];
  }
  size(): number {
    return this.length;
  }
  isEmpty(): boolean {
    return this.length === 0;
  }

  private heapifyUp(index: number) {
    if (index === 0) return;

    const parentIndex = this.parent(index);
    const parentValue = this.data[parentIndex];
    const currentValue = this.data[index];
    if (this.greaterThan(parentValue, currentValue)) {
      this.data[index] = parentValue;
      this.data[parentIndex] = currentValue;
      this.heapifyUp(parentIndex);
    }
  }

  private heapifyDown(index: number) {
    const leftChildIndex = this.leftChild(index);
    if (index >= this.length || leftChildIndex >= this.length) {
      return;
    }
    const rightChildIndex = this.rightChild(index);
    const currentValue = this.data[index];
    const leftValue = this.data[leftChildIndex];
    const rightValue =
      rightChildIndex < this.length ? this.data[rightChildIndex] : undefined;

    // pick the smaller child (if right child exists, compare them)
    let smallerIndex = leftChildIndex;
    if (rightValue !== undefined && this.greaterThan(leftValue, rightValue)) {
      smallerIndex = rightChildIndex;
    }

    const smallerValue = this.data[smallerIndex];

    // if current > smaller, swap
    if (this.greaterThan(currentValue, smallerValue)) {
      this.data[index] = smallerValue;
      this.data[smallerIndex] = currentValue;
      this.heapifyDown(smallerIndex);
    }
  }

  private parent(index: number) {
    return Math.floor((index - 1) / 2);
  }

  private leftChild(index: number) {
    return index * 2 + 1;
  }

  private rightChild(index: number) {
    return index * 2 + 2;
  }
}
