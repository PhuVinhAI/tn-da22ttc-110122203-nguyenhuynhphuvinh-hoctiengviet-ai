import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../data/simulation_repository.dart';
import '../domain/active_session.dart';
import '../domain/scenario_category.dart';
import '../domain/scenario_detail.dart';
import '../domain/scenario_summary.dart';
import '../domain/simulation_result_detail.dart';
import '../domain/simulation_result_summary.dart';
import '../domain/simulation_stats.dart';

final simulationRepositoryProvider = Provider<SimulationRepository>((ref) {
  return SimulationRepository(ref.watch(dioProvider));
});

class SimulationCategoriesNotifier
    extends CachedRepository<List<ScenarioCategory>> {
  @override
  Duration get ttl => const Duration(minutes: 30);

  @override
  Future<List<ScenarioCategory>> fetchFromApi() async {
    final repo = ref.read(simulationRepositoryProvider);
    return repo.listCategories();
  }
}

final simulationCategoriesProvider =
    AsyncNotifierProvider<SimulationCategoriesNotifier, List<ScenarioCategory>>(
  SimulationCategoriesNotifier.new,
);

class ScenarioFilter {
  const ScenarioFilter({this.categoryId, this.level, this.difficulty});
  final String? categoryId;
  final String? level;
  final String? difficulty;

  ScenarioFilter copyWith({
    String? categoryId,
    String? level,
    String? difficulty,
    bool clearCategory = false,
    bool clearLevel = false,
    bool clearDifficulty = false,
  }) {
    return ScenarioFilter(
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      level: clearLevel ? null : (level ?? this.level),
      difficulty: clearDifficulty ? null : (difficulty ?? this.difficulty),
    );
  }

  bool get isActive => categoryId != null || level != null || difficulty != null;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScenarioFilter &&
          runtimeType == other.runtimeType &&
          categoryId == other.categoryId &&
          level == other.level &&
          difficulty == other.difficulty;

  @override
  int get hashCode => Object.hash(categoryId, level, difficulty);
}

class ScenarioFilterNotifier extends Notifier<ScenarioFilter> {
  @override
  ScenarioFilter build() => const ScenarioFilter();

  void setFilter(ScenarioFilter filter) {
    state = filter;
  }

  void setCategory(String? categoryId) {
    state = state.copyWith(
      categoryId: categoryId,
      clearCategory: categoryId == null,
    );
  }

  void setLevel(String? level) {
    state = state.copyWith(level: level, clearLevel: level == null);
  }

  void setDifficulty(String? difficulty) {
    state = state.copyWith(
      difficulty: difficulty,
      clearDifficulty: difficulty == null,
    );
  }

  void clearAll() {
    state = const ScenarioFilter();
  }
}

final scenarioFilterProvider =
    NotifierProvider<ScenarioFilterNotifier, ScenarioFilter>(
  ScenarioFilterNotifier.new,
);

class SimulationScenariosNotifier extends AsyncNotifier<List<ScenarioSummary>> {
  @override
  Future<List<ScenarioSummary>> build() async {
    final filter = ref.watch(scenarioFilterProvider);
    final repo = ref.read(simulationRepositoryProvider);
    return repo.listScenarios(
      categoryId: filter.categoryId,
      level: filter.level,
      difficulty: filter.difficulty,
    );
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

final simulationScenariosProvider = AsyncNotifierProvider<
    SimulationScenariosNotifier, List<ScenarioSummary>>(
  SimulationScenariosNotifier.new,
);

final scenarioDetailProvider =
    FutureProvider.family<ScenarioDetail, String>((ref, id) async {
  final repo = ref.read(simulationRepositoryProvider);
  return repo.getScenario(id);
});

class SimulationResultsNotifier
    extends AsyncNotifier<List<SimulationResultSummary>>
    with DataChangeBusSubscriber<List<SimulationResultSummary>> {
  SimulationResultsNotifier(this.scenarioId);

  final String? scenarioId;

  @override
  Future<List<SimulationResultSummary>> build() async {
    watchTags({'simulation-results'});
    final repo = ref.read(simulationRepositoryProvider);
    return repo.listResults(scenarioId: scenarioId);
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

final simulationResultsProvider = AsyncNotifierProvider.family<
    SimulationResultsNotifier, List<SimulationResultSummary>, String?>(
  (arg) => SimulationResultsNotifier(arg),
);

void notifySimulationResultsChanged(Ref ref, {String? scenarioId}) {
  ref.read(dataChangeBusProvider.notifier).emit({
    'simulation',
    'simulation-results',
  });
  ref.invalidate(simulationResultsProvider(null));
  if (scenarioId != null && scenarioId.isNotEmpty) {
    ref.invalidate(simulationResultsProvider(scenarioId));
  }
}

final simulationResultDetailProvider =
    FutureProvider.family<SimulationResultDetail, String>((ref, id) async {
  final repo = ref.read(simulationRepositoryProvider);
  return repo.getResult(id);
});

class PausedSessionNotifier extends AsyncNotifier<ActiveSession?> {
  @override
  Future<ActiveSession?> build() async {
    final repo = ref.read(simulationRepositoryProvider);
    return repo.getActiveSession();
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

final pausedSessionProvider =
    AsyncNotifierProvider<PausedSessionNotifier, ActiveSession?>(
  PausedSessionNotifier.new,
);

class SimulationStatsNotifier extends CachedRepository<SimulationStats>
    with DataChangeBusSubscriber<SimulationStats> {
  @override
  Duration get ttl => Duration.zero;

  @override
  Future<SimulationStats> fetchFromApi() async {
    final repo = ref.read(simulationRepositoryProvider);
    return repo.getStats();
  }

  @override
  Future<SimulationStats> build() async {
    watchTags({'simulation'});
    return super.build();
  }
}

final simulationStatsProvider =
    AsyncNotifierProvider<SimulationStatsNotifier, SimulationStats>(
  SimulationStatsNotifier.new,
);
