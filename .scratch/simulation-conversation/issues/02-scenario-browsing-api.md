Status: done

# 02 — Scenario browsing API — categories, list, detail

## Parent

[PRD: Hội thoại mô phỏng](../PRD.md)

## What to build

Implement the read-only browsing endpoints that let learners discover scenario categories, filter scenarios, and view scenario details with character information. This is the "catalog" part of the simulation feature.

**Three endpoints**, all guarded by `@RequirePermissions(Permission.SIMULATION_ACCESS)`:

1. `GET /api/v1/simulations/categories` — List all scenario categories, ordered by `orderIndex`. Response includes `id`, `name`, `description`, `icon`, `color`.

2. `GET /api/v1/simulations/scenarios` — List published scenarios with optional filters:
   - `categoryId` (uuid) — filter by category
   - `level` (UserLevel enum) — filter by `requiredLevel`
   - `difficulty` (Difficulty enum) — filter by difficulty
   - Response includes: `id`, `title`, `description`, `requiredLevel`, `difficulty`, `estimatedMinutes`, character count, category info

3. `GET /api/v1/simulations/scenarios/:id` — Scenario detail with:
   - Full scenario data including `scoringCriteria`
   - All characters for the scenario (with `isPlayable` flag so the client can filter the selection list)
   - Characters ordered by `orderIndex`

**Service layer** — `ScenariosService` with query methods and proper DTO validation for filter params.

**Unit tests** — Test query/filter logic, detail retrieval, exclusion of unpublished scenarios.

## Acceptance criteria

- [x] `GET /categories` returns all categories ordered by `orderIndex`
- [x] `GET /scenarios` returns only published scenarios
- [x] `GET /scenarios?categoryId=X` correctly filters by category
- [x] `GET /scenarios?level=A1` correctly filters by required level
- [x] `GET /scenarios?difficulty=EASY` correctly filters by difficulty
- [x] Filters can be combined (e.g. `?categoryId=X&level=A1&difficulty=EASY`)
- [x] `GET /scenarios/:id` returns scenario with all characters ordered by `orderIndex`
- [x] All endpoints are guarded by `SIMULATION_ACCESS` permission
- [x] All responses wrapped in `{ data: T }` by the existing `TransformInterceptor`
- [x] Unit tests for `ScenariosService` pass
- [x] `bun run typecheck` passes

## Blocked by

- [01 — Enums, entities, and module scaffold](./01-enums-entities-module-scaffold.md)

## Implementation notes

### Files created

- `backend/src/modules/simulations/application/repositories/scenario-categories.repository.ts` — Repository for `ScenarioCategory` entity, exposes `findAll()` ordered by `orderIndex ASC`.
- `backend/src/modules/simulations/application/repositories/scenarios.repository.ts` — Repository for `Scenario` entity, exposes `findPublished(filter)` with optional `categoryId`, `level`, `difficulty` filters, and `findById(id)` with eager character relations ordered by `orderIndex`.
- `backend/src/modules/simulations/application/scenarios.service.ts` — Service with `listCategories()`, `listScenarios(filter)` (maps raw entities to a summary DTO with `characterCount`), and `getScenarioDetail(id)` (throws `NotFoundException` when missing).
- `backend/src/modules/simulations/application/scenarios.service.spec.ts` — 10 unit tests covering all acceptance criteria (TDD: RED→GREEN per vertical slice). All tests pass (42 suites / 591 tests total still green).
- `backend/src/modules/simulations/dto/list-scenarios.dto.ts` — Query DTO with `@IsOptional` `@IsUUID` `categoryId`, `@IsEnum(UserLevel)` `level`, `@IsEnum(Difficulty)` `difficulty`.
- `backend/src/modules/simulations/presentation/simulations.controller.ts` — Controller mounted at `simulations/`, three `@Get` endpoints each decorated with `@RequirePermissions(Permission.SIMULATION_ACCESS)`, full Swagger docs.

### Files modified

- `backend/src/modules/simulations/simulations.module.ts` — Wired `ScenariosService`, `ScenariosRepository`, `ScenarioCategoriesRepository` into providers; registered `SimulationsController`; exported `ScenariosService`.
