export class PriorityQueue {
    heap;
    compare;
    constructor(compare) {
        this.heap = [];
        this.compare = compare;
    }
    enqueue(item) {
        this.heap.push(item);
        this.heapifyUp(this.heap.length - 1);
    }
    dequeue() {
        if (this.heap.length === 0)
            return null;
        if (this.heap.length === 1)
            return this.heap.pop();
        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown(0);
        return root;
    }
    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }
    size() {
        return this.heap.length;
    }
    clear() {
        this.heap = [];
    }
    heapifyUp(index) {
        if (index === 0)
            return;
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex]) > 0) {
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            this.heapifyUp(parentIndex);
        }
    }
    heapifyDown(index) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let largest = index;
        if (leftChild < this.heap.length &&
            this.compare(this.heap[leftChild], this.heap[largest]) > 0) {
            largest = leftChild;
        }
        if (rightChild < this.heap.length &&
            this.compare(this.heap[rightChild], this.heap[largest]) > 0) {
            largest = rightChild;
        }
        if (largest !== index) {
            [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
            this.heapifyDown(largest);
        }
    }
}
