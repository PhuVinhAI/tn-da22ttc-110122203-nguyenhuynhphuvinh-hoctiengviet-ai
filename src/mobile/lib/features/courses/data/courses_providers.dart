import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../data/courses_repository.dart';
import '../domain/course_models.dart';

part 'courses_providers.g.dart';

final coursesRepositoryProvider = Provider<CoursesRepository>((ref) {
  return CoursesRepository(ref.watch(dioProvider));
});

class CoursesNotifier extends CachedRepository<List<Course>> {
  @override
  Duration get ttl => const Duration(minutes: 30);

  @override
  Future<List<Course>> fetchFromApi() async {
    final repo = ref.read(coursesRepositoryProvider);
    return repo.getPublishedCourses();
  }
}

final coursesProvider = AsyncNotifierProvider<CoursesNotifier, List<Course>>(
  CoursesNotifier.new,
);

@Riverpod(keepAlive: true)
class CourseDetail extends _$CourseDetail {
  Course? _cachedData;
  DateTime? _lastFetchedAt;
  bool _isRefreshing = false;
  static const _ttl = Duration(minutes: 30);

  @override
  Future<Course> build(String id) async {
    final now = DateTime.now();
    if (_cachedData != null) {
      final isFresh = _lastFetchedAt != null &&
          now.difference(_lastFetchedAt!) < _ttl;
      if (!isFresh) {
        Future.microtask(() => _refreshInBackground(id));
      }
      return _cachedData!;
    }
    final repo = ref.read(coursesRepositoryProvider);
    final data = await repo.getCourseById(id);
    _cachedData = data;
    _lastFetchedAt = now;
    return data;
  }

  Future<void> _refreshInBackground(String id) async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      final repo = ref.read(coursesRepositoryProvider);
      final fresh = await repo.getCourseById(id);
      _cachedData = fresh;
      _lastFetchedAt = DateTime.now();
      state = AsyncData(fresh);
    } catch (_) {
      // Keep stale cached data.
    } finally {
      _isRefreshing = false;
    }
  }

  Future<void> refresh() async {
    _lastFetchedAt = null;
    ref.invalidateSelf();
  }
}

@Riverpod(keepAlive: true)
class ModuleDetail extends _$ModuleDetail {
  CourseModule? _cachedData;
  DateTime? _lastFetchedAt;
  bool _isRefreshing = false;
  static const _ttl = Duration(minutes: 30);

  @override
  Future<CourseModule> build(String id) async {
    final now = DateTime.now();
    if (_cachedData != null) {
      final isFresh = _lastFetchedAt != null &&
          now.difference(_lastFetchedAt!) < _ttl;
      if (!isFresh) {
        Future.microtask(() => _refreshInBackground(id));
      }
      return _cachedData!;
    }
    final repo = ref.read(coursesRepositoryProvider);
    final data = await repo.getModuleById(id);
    _cachedData = data;
    _lastFetchedAt = now;
    return data;
  }

  Future<void> _refreshInBackground(String id) async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      final repo = ref.read(coursesRepositoryProvider);
      final fresh = await repo.getModuleById(id);
      _cachedData = fresh;
      _lastFetchedAt = DateTime.now();
      state = AsyncData(fresh);
    } catch (_) {
      // Keep stale cached data.
    } finally {
      _isRefreshing = false;
    }
  }

  Future<void> refresh() async {
    _lastFetchedAt = null;
    ref.invalidateSelf();
  }
}

class UserProgressNotifier extends CachedRepository<List<UserProgress>>
    with DataChangeBusSubscriber<List<UserProgress>> {
  @override
  Duration get ttl => const Duration(minutes: 1);

  @override
  Future<List<UserProgress>> fetchFromApi() async {
    final repo = ref.read(coursesRepositoryProvider);
    return repo.getUserProgress();
  }

  @override
  Future<List<UserProgress>> build() async {
    watchTags({'progress'});
    return super.build();
  }
}

final userProgressProvider =
    AsyncNotifierProvider<UserProgressNotifier, List<UserProgress>>(
  UserProgressNotifier.new,
);
