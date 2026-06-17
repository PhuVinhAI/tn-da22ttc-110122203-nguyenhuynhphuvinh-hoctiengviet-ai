/**
 * E2E test bootstrap — set required env vars BEFORE any spec imports AppModule.
 *
 * env.validation.ts makes JWT_SECRET required (no hardcoded fallback), so specs
 * that `imports: [AppModule]` (running the real ConfigModule.forRoot) would
 * throw at Test.createTestingModule().compile() without this safety net.
 *
 * A real backend/.env normally provides JWT_SECRET, but pinning it here makes
 * the e2e suite deterministic regardless of the developer's local .env state.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-key-for-e2e-testing';
