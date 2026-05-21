Status: done

## Parent

`.scratch/simulation-conversation-mobile/PRD.md`

## What to build

Build the **Tình huống** browsing experience on the tab landing: scenario cards below the category grid, multi-filter bottom sheet, and category-filter interaction.

When a category card is tapped, filter scenarios by that category and show a section header with the category name. "See all" clears the filter. A filter button on the AppBar opens a bottom sheet with Category, Level (CEFR levels), and Difficulty (EASY/MEDIUM/HARD) selectors. All filters apply at once on "Apply" tap (no incremental re-rendering while selecting). The AppBar filter icon shows which category is currently active.

Each scenario card (`AppCard` outlined) shows: top row (level `AppBadge` with CEFR colors + clock icon + estimated minutes), title (maxLines 2), description (maxLines 2), bottom row (difficulty `AppBadge` + people icon + character count). Tapping a card pushes to scenario detail (route added in slice 03).

Add `listScenarios({categoryId, level, difficulty})` to `SimulationRepository`. Create `ScenarioSummary` model (fromJson: id, title, description, requiredLevel, difficulty, estimatedMinutes, characterCount, categoryInfo). Create `simulationScenariosProvider` (AsyncNotifier with filter params).

## Acceptance criteria

- [x] Scenario cards render below category grid in a 2-column grid
- [x] Tapping a category card filters scenarios by that category; section header shows category name
- [x] "See all" or re-tapping selected category clears filter; header reverts to "Tất cả tình huống"
- [x] Filter bottom sheet has Category, Level, Difficulty selectors; "Áp dụng" applies all at once
- [x] AppBar filter icon indicates active category filter
- [x] Scenario card shows level badge (CEFR colors), title, description, difficulty badge (EASY=success, MEDIUM=warning, HARD=error), estimated time, character count
- [x] `SimulationRepository.listScenarios()` calls `GET /simulations/scenarios` with query params
- [x] `ScenarioSummary` model parses all fields including nullable `categoryInfo`
- [x] `simulationScenariosProvider` refetches when filter params change
- [x] Loading shimmer, error, and empty states work for scenario grid

## Blocked by

- `.scratch/simulation-conversation-mobile/issues/01-bottom-nav-thuc-hanh-tab-category-grid.md`

## Implementation notes

### Files created

- `mobile/lib/features/simulation/domain/scenario_summary.dart` — `ScenarioSummary` and `CategoryInfo` domain models with `fromJson`/`toJson` for all fields including nullable `categoryInfo`

### Files modified

- `mobile/lib/features/simulation/data/simulation_repository.dart` — Added `listScenarios({categoryId, level, difficulty})` method calling `GET /simulations/scenarios` with optional query params
- `mobile/lib/features/simulation/data/simulation_providers.dart` — Added `ScenarioFilter` value class, `ScenarioFilterNotifier` (Notifier, replaces removed `StateProvider`), `SimulationScenariosNotifier` (AsyncNotifier that watches filter and refetches), `simulationScenariosProvider`
- `mobile/lib/features/simulation/presentation/screens/practice_screen.dart` — Complete rewrite: added 2-column scenario grid below category grid, category tap filtering with section header + "Xem tất cả", filter bottom sheet (DraggableScrollableSheet with Category/Level/Difficulty chip selectors + "Áp dụng" button), AppBar filter icon with Badge indicator, scenario card layout (level badge CEFR colors, title maxLines 2, description maxLines 2, difficulty badge EASY/MEDIUM/HARD, clock + minutes, people + count), shimmer loading skeleton, error retry, empty state

### Files deleted

None.
