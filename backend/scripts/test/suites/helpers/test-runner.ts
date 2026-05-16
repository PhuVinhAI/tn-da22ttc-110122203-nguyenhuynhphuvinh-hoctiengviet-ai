/**
 * Minimal test runner for the bun-based integration suites under
 * `scripts/test/suites/`. AGENTS.md mandates these stay outside jest, so
 * we ship a tiny `describe`/`it` shim that:
 *
 * - Runs every registered case sequentially (shared DB state requires it)
 * - Prints a one-line pass/fail per case with timing
 * - Exits the process with code 1 on any failure (so CI catches it)
 *
 * The shim is intentionally < 100 lines — every nicety beyond pass/fail
 * counts and timing is jest territory. Suites pair this with a tiny
 * `expect`-like helper from this same file.
 */

type TestFn = () => Promise<void> | void;

interface RegisteredTest {
  name: string;
  fn: TestFn;
  skip?: boolean;
}

const tests: RegisteredTest[] = [];
let currentSuite: string | null = null;

export function describe(name: string, body: () => void): void {
  const previous = currentSuite;
  currentSuite = name;
  try {
    body();
  } finally {
    currentSuite = previous;
  }
}

export function it(name: string, fn: TestFn): void {
  const fullName = currentSuite ? `${currentSuite} > ${name}` : name;
  tests.push({ name: fullName, fn });
}

it.skip = (name: string, _fn: TestFn): void => {
  const fullName = currentSuite ? `${currentSuite} > ${name}` : name;
  tests.push({ name: fullName, fn: async () => {}, skip: true });
};

export async function runRegisteredTests(suiteName: string): Promise<boolean> {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: { name: string; error: unknown }[] = [];

  console.log(`\nRunning ${suiteName} (${tests.length} cases)\n`);

  for (const t of tests) {
    if (t.skip) {
      skipped++;
      console.log(`  - SKIP  ${t.name}`);
      continue;
    }
    const start = Date.now();
    try {
      await t.fn();
      const ms = Date.now() - start;
      passed++;
      console.log(`  ✓ PASS  ${t.name} (${ms}ms)`);
    } catch (error) {
      const ms = Date.now() - start;
      failed++;
      failures.push({ name: t.name, error });
      console.log(`  ✗ FAIL  ${t.name} (${ms}ms)`);
    }
  }

  console.log(
    `\n${passed} passed, ${failed} failed, ${skipped} skipped (${tests.length} total)`,
  );

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`\n  ${f.name}:`);
      console.log(
        `    ${f.error instanceof Error ? f.error.stack ?? f.error.message : String(f.error)}`,
      );
    }
  }

  return failed === 0;
}

export function expect<T>(actual: T) {
  return {
    toBe(expected: T): void {
      if (actual !== expected) {
        throw new Error(
          `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toEqual(expected: unknown): void {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected ${b} but got ${a}`);
      }
    },
    toBeTruthy(): void {
      if (!actual) {
        throw new Error(`Expected truthy but got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy(): void {
      if (actual) {
        throw new Error(`Expected falsy but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(n: number): void {
      if (typeof actual !== 'number' || actual <= n) {
        throw new Error(`Expected ${actual} > ${n}`);
      }
    },
    toContain<U>(item: U): void {
      if (!Array.isArray(actual) || !actual.includes(item)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`,
        );
      }
    },
  };
}
