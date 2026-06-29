import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:linvnix/features/home/data/home_providers.dart';

class _TestContinueLearningNotifier extends ContinueLearningNotifier {
  final ContinueLearning? _result;

  _TestContinueLearningNotifier(this._result);

  @override
  Future<ContinueLearning?> build() async {
    watchTags({'progress'});
    return _result;
  }
}

void main() {
  group('continueLearningProvider', () {
    test('returns null when no progress exists', () async {
      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(null),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNull);
    });

    test('returns IN_PROGRESS lesson when available', () async {
      final expected = ContinueLearning(
        lessonId: 'l2',
        lessonTitle: 'Lesson 2',
        status: ContinueLearningStatus.inProgress,
      );

      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(expected),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNotNull);
      expect(result!.lessonId, 'l2');
      expect(result.lessonTitle, 'Lesson 2');
      expect(result.status, ContinueLearningStatus.inProgress);
    });

    test('falls back to latest COMPLETED when no IN_PROGRESS', () async {
      final expected = ContinueLearning(
        lessonId: 'l2',
        lessonTitle: 'Lesson 2',
        status: ContinueLearningStatus.completed,
      );

      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(expected),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNotNull);
      expect(result!.lessonId, 'l2');
      expect(result.lessonTitle, 'Lesson 2');
      expect(result.status, ContinueLearningStatus.completed);
    });

    test('returns null when progress exists but lesson is null', () async {
      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(null),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNull);
    });

    test('prefers most recent IN_PROGRESS over older ones', () async {
      final expected = ContinueLearning(
        lessonId: 'l2',
        lessonTitle: 'Newer Lesson',
        status: ContinueLearningStatus.inProgress,
      );

      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(expected),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNotNull);
      expect(result!.lessonId, 'l2');
      expect(result.lessonTitle, 'Newer Lesson');
    });

    test('prefers IN_PROGRESS over COMPLETED even if COMPLETED is newer',
        () async {
      final expected = ContinueLearning(
        lessonId: 'l2',
        lessonTitle: 'Older In Progress',
        status: ContinueLearningStatus.inProgress,
      );

      final container = ProviderContainer(
        overrides: [
          continueLearningProvider.overrideWith(
            () => _TestContinueLearningNotifier(expected),
          ),
        ],
      );

      final result = await container.read(continueLearningProvider.future);
      expect(result, isNotNull);
      expect(result!.lessonId, 'l2');
      expect(result.status, ContinueLearningStatus.inProgress);
    });
  });
}
