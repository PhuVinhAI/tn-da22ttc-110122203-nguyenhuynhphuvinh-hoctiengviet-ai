# Integration Tests - Clean Architecture

Test scripts để test API thật với database thật, không mock.

## Cấu trúc

```
scripts/test/
├── README.md                    # This file
├── config/                      # Test configuration
│   └── test.config.ts          # API base URL, credentials
├── utils/                       # Test utilities
│   ├── api-client.ts           # HTTP client wrapper
│   ├── test-data.ts            # Test data generators
│   └── assertions.ts           # Custom assertions
├── fixtures/                    # Test fixtures
│   ├── users.fixture.ts        # User test data
│   ├── courses.fixture.ts      # Course test data
│   └── vocabularies.fixture.ts # Vocabulary test data
├── scenarios/                   # Test scenarios (end-to-end flows)
│   ├── 01-auth.scenario.ts     # Auth flow
│   ├── 02-learning.scenario.ts # Learning flow
│   └── 03-progress.scenario.ts # Progress tracking flow
└── suites/                      # Test suites by module
    ├── auth.test.ts            # Auth tests
    ├── courses.test.ts         # Courses tests
    ├── vocabularies.test.ts    # Vocabularies tests
    ├── exercises.test.ts       # Exercises tests
    └── progress.test.ts        # Progress tests
```

## Chạy tests

### Chạy tất cả test suites
```bash
bun run test:integration
```

### Chạy test suite cụ thể
```bash
bun run test:integration:auth          # Auth tests
bun run test:integration:courses       # Courses tests
bun run test:integration:vocabularies  # Vocabularies tests
bun run test:integration:exercises     # Exercises tests
bun run test:integration:progress      # Progress tests
```

### Chạy tất cả scenarios (end-to-end)
```bash
bun run test:scenarios
```

### Chạy scenario cụ thể
```bash
bun run test:scenario:auth       # Authentication flow
bun run test:scenario:learning   # Complete learning flow
bun run test:scenario:progress   # Progress tracking flow
```

## Design Patterns

1. **Builder Pattern** - Tạo test data
2. **Factory Pattern** - Tạo API clients
3. **Page Object Pattern** - Wrap API endpoints
4. **Fixture Pattern** - Reusable test data
5. **Scenario Pattern** - End-to-end user flows

## Principles

- ✅ Test với API thật
- ✅ Test với database thật
- ✅ Không mock
- ✅ Clean up sau mỗi test
- ✅ Isolated tests
- ✅ Readable test names

### Manual Tests (Interactive)

Test các flow yêu cầu tương tác người dùng như OAuth.

```bash
# Google OAuth login test
bun run test:manual:google-oauth
```

Chi tiết: [Manual Tests README](./manual/README.md)
