import { describe, it, expect, beforeEach } from 'bun:test';
import {
  CircularBuffer,
  NumericCircularBuffer,
  createBuffer,
  createNumericBuffer
} from '../../src/core/utils/circular-buffer';

describe('CircularBuffer', () => {
  describe('Constructor', () => {
    it('should create buffer with specified size', () => {
      const buffer = new CircularBuffer<number>(10);
      expect(buffer.capacity).toBe(10);
      expect(buffer.length).toBe(0);
    });

    it('should throw error for non-positive size', () => {
      expect(() => new CircularBuffer(0)).toThrow('Buffer size must be positive');
      expect(() => new CircularBuffer(-1)).toThrow('Buffer size must be positive');
    });
  });

  describe('push', () => {
    it('should add items to buffer', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.length).toBe(3);
    });

    it('should handle push up to capacity', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.length).toBe(3);
      expect(buffer.isFull).toBe(true);
    });

    it('should overwrite oldest item when full', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Overwrites 1

      expect(buffer.length).toBe(3);
      expect(buffer.peek()).toBe(2); // Oldest is now 2
      expect(buffer.toArray()).toEqual([2, 3, 4]);
    });

    it('should continue overwriting in circular fashion', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Overwrites 1
      buffer.push(5); // Overwrites 2
      buffer.push(6); // Overwrites 3

      expect(buffer.toArray()).toEqual([4, 5, 6]);
    });
  });

  describe('shift', () => {
    it('should remove and return oldest item', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.shift()).toBe(1);
      expect(buffer.length).toBe(2);
      expect(buffer.shift()).toBe(2);
      expect(buffer.shift()).toBe(3);
      expect(buffer.length).toBe(0);
    });

    it('should return undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.shift()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('should return oldest item without removing', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.peek()).toBe(1);
      expect(buffer.length).toBe(3); // Should not change
    });

    it('should return undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.peek()).toBeUndefined();
    });
  });

  describe('peekLast', () => {
    it('should return newest item without removing', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.peekLast()).toBe(3);
      expect(buffer.length).toBe(3);
    });

    it('should return undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.peekLast()).toBeUndefined();
    });

    it('should work correctly after wrapping', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.peekLast()).toBe(4);
    });
  });

  describe('get', () => {
    it('should return item at index', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(2);
      expect(buffer.get(2)).toBe(3);
    });

    it('should return undefined for out of bounds', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);

      expect(buffer.get(-1)).toBeUndefined();
      expect(buffer.get(2)).toBeUndefined();
      expect(buffer.get(10)).toBeUndefined();
    });

    it('should work correctly after wrapping', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Overwrites 1

      expect(buffer.get(0)).toBe(2);
      expect(buffer.get(1)).toBe(3);
      expect(buffer.get(2)).toBe(4);
    });
  });

  describe('Properties', () => {
    it('should track length correctly', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.length).toBe(0);

      buffer.push(1);
      expect(buffer.length).toBe(1);

      buffer.push(2);
      expect(buffer.length).toBe(2);

      buffer.shift();
      expect(buffer.length).toBe(1);
    });

    it('should report isEmpty correctly', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.isEmpty).toBe(true);

      buffer.push(1);
      expect(buffer.isEmpty).toBe(false);

      buffer.shift();
      expect(buffer.isEmpty).toBe(true);
    });

    it('should report isFull correctly', () => {
      const buffer = new CircularBuffer<number>(3);
      expect(buffer.isFull).toBe(false);

      buffer.push(1);
      expect(buffer.isFull).toBe(false);

      buffer.push(2);
      expect(buffer.isFull).toBe(false);

      buffer.push(3);
      expect(buffer.isFull).toBe(true);

      buffer.shift();
      expect(buffer.isFull).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.length).toBe(0);
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.peek()).toBeUndefined();
    });
  });

  describe('toArray', () => {
    it('should convert buffer to array in correct order', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should return empty array for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.toArray()).toEqual([]);
    });

    it('should maintain order after wrapping', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      expect(buffer.toArray()).toEqual([3, 4, 5]);
    });
  });

  describe('forEach', () => {
    it('should iterate over all items in order', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const items: number[] = [];
      buffer.forEach((item, index) => {
        items.push(item);
      });

      expect(items).toEqual([1, 2, 3]);
    });

    it('should provide correct indices', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(10);
      buffer.push(20);
      buffer.push(30);

      const indices: number[] = [];
      buffer.forEach((item, index) => {
        indices.push(index);
      });

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('map', () => {
    it('should transform all items', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const doubled = buffer.map(item => item * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it('should provide index to callback', () => {
      const buffer = new CircularBuffer<string>(5);
      buffer.push('a');
      buffer.push('b');
      buffer.push('c');

      const result = buffer.map((item, index) => `${index}:${item}`);
      expect(result).toEqual(['0:a', '1:b', '2:c']);
    });
  });

  describe('filter', () => {
    it('should filter items based on predicate', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      const evens = buffer.filter(item => item % 2 === 0);
      expect(evens).toEqual([2, 4]);
    });

    it('should return empty array when no items match', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(3);
      buffer.push(5);

      const evens = buffer.filter(item => item % 2 === 0);
      expect(evens).toEqual([]);
    });
  });

  describe('reduce', () => {
    it('should reduce to single value', () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      const sum = buffer.reduce((acc, item) => acc + item, 0);
      expect(sum).toBe(10);
    });

    it('should work with different types', () => {
      const buffer = new CircularBuffer<string>(5);
      buffer.push('a');
      buffer.push('b');
      buffer.push('c');

      const joined = buffer.reduce((acc, item) => acc + item, '');
      expect(joined).toBe('abc');
    });
  });

  describe('Generic Types', () => {
    it('should work with strings', () => {
      const buffer = new CircularBuffer<string>(3);
      buffer.push('hello');
      buffer.push('world');

      expect(buffer.toArray()).toEqual(['hello', 'world']);
    });

    it('should work with objects', () => {
      const buffer = new CircularBuffer<{ id: number; name: string }>(3);
      buffer.push({ id: 1, name: 'Alice' });
      buffer.push({ id: 2, name: 'Bob' });

      const result = buffer.toArray();
      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);
    });
  });
});

describe('NumericCircularBuffer', () => {
  describe('Statistics', () => {
    it('should calculate sum', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.getSum()).toBe(10);
    });

    it('should calculate average', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(2);
      buffer.push(4);
      buffer.push(6);
      buffer.push(8);

      expect(buffer.getAverage()).toBe(5);
    });

    it('should calculate min', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(5);
      buffer.push(2);
      buffer.push(8);
      buffer.push(1);

      expect(buffer.getMin()).toBe(1);
    });

    it('should calculate max', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(5);
      buffer.push(2);
      buffer.push(8);
      buffer.push(1);

      expect(buffer.getMax()).toBe(8);
    });

    it('should return 0 for average of empty buffer', () => {
      const buffer = new NumericCircularBuffer(5);
      expect(buffer.getAverage()).toBe(0);
    });

    it('should return 0 for min of empty buffer', () => {
      const buffer = new NumericCircularBuffer(5);
      expect(buffer.getMin()).toBe(0);
    });

    it('should return 0 for max of empty buffer', () => {
      const buffer = new NumericCircularBuffer(5);
      expect(buffer.getMax()).toBe(0);
    });
  });

  describe('Statistics with Overflow', () => {
    it('should update statistics when buffer wraps', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(1); // sum: 1
      buffer.push(2); // sum: 3
      buffer.push(3); // sum: 6
      buffer.push(4); // sum: 9 (removes 1, adds 4)

      expect(buffer.getSum()).toBe(9);
      expect(buffer.getAverage()).toBe(3);
    });

    it('should maintain correct sum after multiple wraps', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);
      buffer.push(6);

      expect(buffer.toArray()).toEqual([4, 5, 6]);
      expect(buffer.getSum()).toBe(15);
    });

    it('should recalculate min/max correctly', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(1);
      buffer.push(5);
      buffer.push(3);
      buffer.push(7); // Removes 1

      expect(buffer.getMin()).toBe(3);
      expect(buffer.getMax()).toBe(7);
    });
  });

  describe('Variance and Standard Deviation', () => {
    it('should calculate variance', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(2);
      buffer.push(4);
      buffer.push(6);
      buffer.push(8);

      const variance = buffer.getVariance();
      expect(variance).toBeCloseTo(5, 1); // Variance of [2,4,6,8] is 5
    });

    it('should calculate standard deviation', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(2);
      buffer.push(4);
      buffer.push(6);
      buffer.push(8);

      const stdDev = buffer.getStdDev();
      expect(stdDev).toBeCloseTo(Math.sqrt(5), 2);
    });

    it('should return 0 variance for single item', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(5);

      expect(buffer.getVariance()).toBe(0);
      expect(buffer.getStdDev()).toBe(0);
    });

    it('should return 0 variance for empty buffer', () => {
      const buffer = new NumericCircularBuffer(5);

      expect(buffer.getVariance()).toBe(0);
      expect(buffer.getStdDev()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return all statistics', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);

      const stats = buffer.getStats();

      expect(stats.count).toBe(5);
      expect(stats.sum).toBe(15);
      expect(stats.average).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.variance).toBeCloseTo(2, 1);
      expect(stats.stdDev).toBeCloseTo(Math.sqrt(2), 2);
    });
  });

  describe('Percentile and Median', () => {
    it('should calculate median for odd count', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(3);
      buffer.push(2);
      buffer.push(5);
      buffer.push(4);

      expect(buffer.getMedian()).toBe(3);
    });

    it('should calculate median for even count', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      // For even count [1,2,3,4], 50th percentile is at index ceil(0.5 * 4) - 1 = 1, which is value 2
      expect(buffer.getMedian()).toBe(2);
    });

    it('should calculate percentiles', () => {
      const buffer = new NumericCircularBuffer(10);
      for (let i = 1; i <= 10; i++) {
        buffer.push(i);
      }

      expect(buffer.getPercentile(0)).toBe(1);
      expect(buffer.getPercentile(50)).toBe(5);
      expect(buffer.getPercentile(100)).toBe(10);
    });

    it('should throw error for invalid percentile', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);

      expect(() => buffer.getPercentile(-1)).toThrow('Percentile must be between 0 and 100');
      expect(() => buffer.getPercentile(101)).toThrow('Percentile must be between 0 and 100');
    });

    it('should return 0 for percentile of empty buffer', () => {
      const buffer = new NumericCircularBuffer(5);
      expect(buffer.getPercentile(50)).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset statistics', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.length).toBe(0);
      expect(buffer.getSum()).toBe(0);
      expect(buffer.getAverage()).toBe(0);
      expect(buffer.getMin()).toBe(0);
      expect(buffer.getMax()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative numbers', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(-5);
      buffer.push(-2);
      buffer.push(3);

      expect(buffer.getSum()).toBe(-4);
      expect(buffer.getMin()).toBe(-5);
      expect(buffer.getMax()).toBe(3);
    });

    it('should handle floating point numbers', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(1.5);
      buffer.push(2.7);
      buffer.push(3.2);

      expect(buffer.getSum()).toBeCloseTo(7.4, 1);
      expect(buffer.getAverage()).toBeCloseTo(2.467, 2);
    });

    it('should handle very large numbers', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(1e10);
      buffer.push(2e10);
      buffer.push(3e10);

      expect(buffer.getSum()).toBe(6e10);
      expect(buffer.getAverage()).toBe(2e10);
    });

    it('should handle all zeros', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(0);
      buffer.push(0);
      buffer.push(0);

      expect(buffer.getSum()).toBe(0);
      expect(buffer.getAverage()).toBe(0);
      expect(buffer.getVariance()).toBe(0);
    });

    it('should handle same values', () => {
      const buffer = new NumericCircularBuffer(3);
      buffer.push(5);
      buffer.push(5);
      buffer.push(5);

      expect(buffer.getSum()).toBe(15);
      expect(buffer.getAverage()).toBe(5);
      expect(buffer.getVariance()).toBe(0);
      expect(buffer.getMin()).toBe(5);
      expect(buffer.getMax()).toBe(5);
    });
  });

  describe('Inheritance', () => {
    it('should inherit all CircularBuffer methods', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.peek()).toBe(1);
      expect(buffer.peekLast()).toBe(3);
      expect(buffer.get(1)).toBe(2);
      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should work with forEach, map, filter, reduce', () => {
      const buffer = new NumericCircularBuffer(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      const doubled = buffer.map(x => x * 2);
      expect(doubled).toEqual([2, 4, 6, 8]);

      const evens = buffer.filter(x => x % 2 === 0);
      expect(evens).toEqual([2, 4]);

      const sum = buffer.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(10);
    });
  });
});

describe('Factory Functions', () => {
  it('should create CircularBuffer with createBuffer', () => {
    const buffer = createBuffer<number>(10);
    expect(buffer).toBeInstanceOf(CircularBuffer);
    expect(buffer.capacity).toBe(10);
  });

  it('should create CircularBuffer with default size', () => {
    const buffer = createBuffer<string>();
    expect(buffer.capacity).toBe(1000);
  });

  it('should create NumericCircularBuffer with createNumericBuffer', () => {
    const buffer = createNumericBuffer(10);
    expect(buffer).toBeInstanceOf(NumericCircularBuffer);
    expect(buffer.capacity).toBe(10);
  });

  it('should create NumericCircularBuffer with default size', () => {
    const buffer = createNumericBuffer();
    expect(buffer.capacity).toBe(1000);
  });
});

describe('Performance Characteristics', () => {
  it('should demonstrate O(1) push operation', () => {
    const buffer = new CircularBuffer<number>(1000);

    // Push 1000 items
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      buffer.push(i);
    }
    const timeFor1000 = Date.now() - start;

    // Should be very fast (< 10ms typically)
    expect(timeFor1000).toBeLessThan(50);
  });

  it('should maintain O(1) statistics for NumericCircularBuffer', () => {
    const buffer = new NumericCircularBuffer(1000);

    // Fill buffer
    for (let i = 0; i < 1000; i++) {
      buffer.push(i);
    }

    // Average should be O(1)
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      buffer.getAverage();
      buffer.getSum();
    }
    const timeFor1000Ops = Date.now() - start;

    // Should be very fast (< 5ms typically)
    expect(timeFor1000Ops).toBeLessThan(50);
  });
});
