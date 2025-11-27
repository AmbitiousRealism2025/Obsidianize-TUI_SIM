/**
 * Circular Buffer Implementation
 * O(1) push and average calculation for performance metrics
 *
 * Based on Opus Code Review recommendations (PERF-1.1, PERF-1.2)
 * Version: 1.0.0
 */

/**
 * Generic circular buffer for efficient fixed-size data storage
 * Provides O(1) push operations instead of O(n) shift operations
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly maxSize: number;

  /**
   * Create a new circular buffer
   * @param size Maximum number of elements the buffer can hold
   */
  constructor(size: number) {
    if (size <= 0) {
      throw new Error('Buffer size must be positive');
    }
    this.maxSize = size;
    this.buffer = new Array(size);
  }

  /**
   * Add an item to the buffer (O(1) operation)
   * If buffer is full, oldest item is overwritten
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.maxSize;

    if (this.count < this.maxSize) {
      this.count++;
    } else {
      // Buffer is full, move tail forward (overwrite oldest)
      this.tail = (this.tail + 1) % this.maxSize;
    }
  }

  /**
   * Remove and return the oldest item (O(1) operation)
   */
  shift(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }

    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.tail = (this.tail + 1) % this.maxSize;
    this.count--;

    return item;
  }

  /**
   * Get the oldest item without removing it
   */
  peek(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    return this.buffer[this.tail];
  }

  /**
   * Get the newest item without removing it
   */
  peekLast(): T | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const lastIndex = (this.head - 1 + this.maxSize) % this.maxSize;
    return this.buffer[lastIndex];
  }

  /**
   * Get item at specific index (0 = oldest)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }
    const actualIndex = (this.tail + index) % this.maxSize;
    return this.buffer[actualIndex];
  }

  /**
   * Current number of items in the buffer
   */
  get length(): number {
    return this.count;
  }

  /**
   * Maximum capacity of the buffer
   */
  get capacity(): number {
    return this.maxSize;
  }

  /**
   * Whether the buffer is empty
   */
  get isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Whether the buffer is full
   */
  get isFull(): boolean {
    return this.count === this.maxSize;
  }

  /**
   * Clear all items from the buffer
   */
  clear(): void {
    this.buffer = new Array(this.maxSize);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Convert buffer contents to array (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Execute a function for each item in the buffer
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        callback(item, i);
      }
    }
  }

  /**
   * Apply a function to each item and return new array
   */
  map<U>(callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(callback(item, i));
      }
    }
    return result;
  }

  /**
   * Filter items based on predicate
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined && predicate(item, i)) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Reduce buffer contents to single value
   */
  reduce<U>(callback: (accumulator: U, item: T, index: number) => U, initialValue: U): U {
    let result = initialValue;
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result = callback(result, item, i);
      }
    }
    return result;
  }
}

/**
 * Specialized circular buffer for numeric values with statistical operations
 */
export class NumericCircularBuffer extends CircularBuffer<number> {
  private sum: number = 0;
  private sumSquares: number = 0;
  private minValue: number = Infinity;
  private maxValue: number = -Infinity;

  constructor(size: number) {
    super(size);
  }

  /**
   * Add a number to the buffer, updating running statistics
   */
  push(value: number): void {
    // If buffer is full, we need to remove the oldest value's contribution
    if (this.isFull) {
      const oldestValue = this.peek();
      if (oldestValue !== undefined) {
        this.sum -= oldestValue;
        this.sumSquares -= oldestValue * oldestValue;
      }
    }

    super.push(value);

    // Update running statistics
    this.sum += value;
    this.sumSquares += value * value;

    // Update min/max
    if (value < this.minValue) this.minValue = value;
    if (value > this.maxValue) this.maxValue = value;
  }

  /**
   * Get the sum of all values in the buffer (O(1))
   */
  getSum(): number {
    return this.sum;
  }

  /**
   * Get the average of all values in the buffer (O(1))
   */
  getAverage(): number {
    if (this.isEmpty) return 0;
    return this.sum / this.length;
  }

  /**
   * Get the minimum value in the buffer
   * Note: This may be inaccurate after values are removed
   */
  getMin(): number {
    if (this.isEmpty) return 0;
    // Recalculate min from current values for accuracy
    let min = Infinity;
    this.forEach(value => {
      if (value < min) min = value;
    });
    this.minValue = min;
    return min;
  }

  /**
   * Get the maximum value in the buffer
   * Note: This may be inaccurate after values are removed
   */
  getMax(): number {
    if (this.isEmpty) return 0;
    // Recalculate max from current values for accuracy
    let max = -Infinity;
    this.forEach(value => {
      if (value > max) max = value;
    });
    this.maxValue = max;
    return max;
  }

  /**
   * Get the variance of values in the buffer
   */
  getVariance(): number {
    if (this.length < 2) return 0;
    const avg = this.getAverage();
    const avgSquares = this.sumSquares / this.length;
    return avgSquares - (avg * avg);
  }

  /**
   * Get the standard deviation of values in the buffer
   */
  getStdDev(): number {
    return Math.sqrt(this.getVariance());
  }

  /**
   * Get all statistics as an object
   */
  getStats(): {
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
  } {
    return {
      count: this.length,
      sum: this.sum,
      average: this.getAverage(),
      min: this.getMin(),
      max: this.getMax(),
      variance: this.getVariance(),
      stdDev: this.getStdDev()
    };
  }

  /**
   * Clear the buffer and reset statistics
   */
  clear(): void {
    super.clear();
    this.sum = 0;
    this.sumSquares = 0;
    this.minValue = Infinity;
    this.maxValue = -Infinity;
  }

  /**
   * Get percentile value (approximate)
   * @param percentile Value between 0 and 100
   */
  getPercentile(percentile: number): number {
    if (this.isEmpty) return 0;
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }

    const sorted = this.toArray().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get the median value
   */
  getMedian(): number {
    return this.getPercentile(50);
  }
}

/**
 * Create a circular buffer with a default size
 */
export function createBuffer<T>(size: number = 1000): CircularBuffer<T> {
  return new CircularBuffer<T>(size);
}

/**
 * Create a numeric circular buffer with a default size
 */
export function createNumericBuffer(size: number = 1000): NumericCircularBuffer {
  return new NumericCircularBuffer(size);
}
