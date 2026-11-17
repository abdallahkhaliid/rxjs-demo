/**
 * Minimalist, robust assertion library for RxJS E2E Test Suite.
 * Zero external runtime dependencies.
 */

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' && typeof b !== 'object') return false;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  _assert(condition, message, expected) {
    const passed = this.isNot ? !condition : condition;
    if (!passed) {
      const prefix = this.isNot ? 'Expected NOT: ' : 'Expected: ';
      throw new AssertionError(
        `${prefix}${message}\nActual: ${JSON.stringify(this.actual)}\nExpected: ${JSON.stringify(expected)}`,
        this.actual,
        expected
      );
    }
  }

  toBe(expected) {
    this._assert(Object.is(this.actual, expected), `to be ${expected}`, expected);
  }

  toEqual(expected) {
    this._assert(deepEqual(this.actual, expected), `to deeply equal ${JSON.stringify(expected)}`, expected);
  }

  toBeTruthy() {
    this._assert(Boolean(this.actual), 'to be truthy', true);
  }

  toBeFalsy() {
    this._assert(!this.actual, 'to be falsy', false);
  }

  toBeNull() {
    this._assert(this.actual === null, 'to be null', null);
  }

  toBeUndefined() {
    this._assert(this.actual === undefined, 'to be undefined', undefined);
  }

  toBeDefined() {
    this._assert(this.actual !== undefined, 'to be defined', 'defined');
  }

  toContain(item) {
    if (typeof this.actual === 'string') {
      this._assert(this.actual.includes(item), `to contain substring "${item}"`, item);
    } else if (Array.isArray(this.actual)) {
      const found = this.actual.some(val => deepEqual(val, item));
      this._assert(found, `to contain item ${JSON.stringify(item)}`, item);
    } else if (this.actual instanceof Set) {
      this._assert(this.actual.has(item), `Set to contain item ${JSON.stringify(item)}`, item);
    } else {
      throw new Error(`toContain requires string, Array, or Set; received ${typeof this.actual}`);
    }
  }

  toHaveLength(length) {
    const actualLen = this.actual != null ? this.actual.length : undefined;
    this._assert(actualLen === length, `to have length ${length}`, length);
  }

  toBeGreaterThan(num) {
    this._assert(this.actual > num, `to be > ${num}`, num);
  }

  toBeGreaterThanOrEqual(num) {
    this._assert(this.actual >= num, `to be >= ${num}`, num);
  }

  toBeLessThan(num) {
    this._assert(this.actual < num, `to be < ${num}`, num);
  }

  toBeLessThanOrEqual(num) {
    this._assert(this.actual <= num, `to be <= ${num}`, num);
  }

  toBeCloseTo(expected, delta = 0.05) {
    const diff = Math.abs(this.actual - expected);
    this._assert(diff <= delta, `to be close to ${expected} within delta ${delta} (diff: ${diff})`, expected);
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error('toThrow requires a function');
    }
    let threw = false;
    let thrownError;
    try {
      this.actual();
    } catch (err) {
      threw = true;
      thrownError = err;
    }

    if (!threw) {
      this._assert(false, 'function to throw an error', expectedError);
      return;
    }

    if (expectedError != null) {
      if (typeof expectedError === 'string') {
        const msg = thrownError?.message || String(thrownError);
        this._assert(msg.includes(expectedError), `error message to contain "${expectedError}"`, expectedError);
      } else if (typeof expectedError === 'function') {
        this._assert(thrownError instanceof expectedError, `error to be instance of ${expectedError.name}`, expectedError.name);
      } else if (expectedError instanceof RegExp) {
        const msg = thrownError?.message || String(thrownError);
        this._assert(expectedError.test(msg), `error message to match ${expectedError}`, expectedError);
      }
    } else {
      this._assert(true, 'function threw as expected', null);
    }
  }

  async rejects(expectedError) {
    let threw = false;
    let thrownError;
    try {
      await (typeof this.actual === 'function' ? this.actual() : this.actual);
    } catch (err) {
      threw = true;
      thrownError = err;
    }

    if (!threw) {
      this._assert(false, 'promise to reject', expectedError);
      return;
    }

    if (expectedError != null) {
      if (typeof expectedError === 'string') {
        const msg = thrownError?.message || String(thrownError);
        this._assert(msg.includes(expectedError), `rejected error message to contain "${expectedError}"`, expectedError);
      } else if (typeof expectedError === 'function') {
        this._assert(thrownError instanceof expectedError, `rejected error to be instance of ${expectedError.name}`, expectedError.name);
      }
    } else {
      this._assert(true, 'promise rejected as expected', null);
    }
  }
}

function expect(actual) {
  return new Expectation(actual);
}

module.exports = {
  expect,
  deepEqual,
  AssertionError
};
