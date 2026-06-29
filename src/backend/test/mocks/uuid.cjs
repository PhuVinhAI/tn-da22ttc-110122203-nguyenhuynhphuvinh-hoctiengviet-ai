// CommonJS shim for the ESM-only `uuid@13` package so jest+ts-jest can resolve
// it from e2e suites without choking on the ESM `export` syntax. Wired via
// `moduleNameMapper` in `test/jest-e2e.json`. Behavior-compatible enough for
// test runtime (uses Node's built-in randomUUID for v4-style ids).
const { randomUUID } = require('node:crypto');

const generate = () => randomUUID();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = {
  v1: generate,
  v3: generate,
  v4: generate,
  v5: generate,
  v6: generate,
  v7: generate,
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  validate: (value) => typeof value === 'string' && UUID_RE.test(value),
  version: () => 4,
  parse: () => new Uint8Array(16),
  stringify: () => generate(),
};
