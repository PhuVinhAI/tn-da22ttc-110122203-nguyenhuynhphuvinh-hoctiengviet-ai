import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:linvnix/features/lessons/domain/question_models.dart';
import 'package:linvnix/features/lessons/domain/question_session.dart';
import 'package:linvnix/features/lessons/data/question_session_service.dart';

class _FakeBox implements Box<Map<dynamic, dynamic>> {
  final _data = <String, Map<dynamic, dynamic>>{};

  @override
  Map<dynamic, dynamic>? get(dynamic key, {Map<dynamic, dynamic>? defaultValue}) {
    return _data[key.toString()];
  }

  @override
  Future<void> put(dynamic key, Map<dynamic, dynamic> value) async {
    _data[key.toString()] = Map<dynamic, dynamic>.from(value);
  }

  @override
  Future<void> delete(dynamic key) async {
    _data.remove(key.toString());
  }

  @override
  Future<int> add(Map<dynamic, dynamic> value) => throw UnimplementedError();

  @override
  Future<Iterable<int>> addAll(Iterable<Map<dynamic, dynamic>> values) => throw UnimplementedError();

  @override
  Future<int> clear() => throw UnimplementedError();

  @override
  Future<void> close() => throw UnimplementedError();

  @override
  Future<void> compact() => throw UnimplementedError();

  @override
  Future<void> deleteFromDisk() => throw UnimplementedError();

  @override
  Future<void> flush() => throw UnimplementedError();

  @override
  bool get isEmpty => throw UnimplementedError();

  @override
  bool get isNotEmpty => throw UnimplementedError();

  @override
  bool get isOpen => throw UnimplementedError();

  @override
  Iterable<Map<dynamic, dynamic>> get values => throw UnimplementedError();

  @override
  Iterable<Map<dynamic, dynamic>> valuesBetween({dynamic startKey, dynamic endKey}) => throw UnimplementedError();

  @override
  Map<dynamic, Map<dynamic, dynamic>> toMap() => throw UnimplementedError();

  @override
  dynamic keyAt(int index) => throw UnimplementedError();

  @override
  Stream<BoxEvent> watch({dynamic key}) => throw UnimplementedError();

  @override
  bool containsKey(dynamic key) => throw UnimplementedError();

  @override
  Future<void> deleteAll(Iterable keys) => throw UnimplementedError();

  @override
  Future<void> deleteAt(int index) => throw UnimplementedError();

  @override
  Future<void> putAll(Map<dynamic, Map<dynamic, dynamic>> entries) => throw UnimplementedError();

  @override
  Future<void> putAt(int index, Map<dynamic, dynamic> value) => throw UnimplementedError();

  @override
  Map<dynamic, dynamic>? getAt(int index) => throw UnimplementedError();

  @override
  int get length => throw UnimplementedError();

  @override
  Iterable<dynamic> get keys => throw UnimplementedError();

  @override
  String get name => throw UnimplementedError();

  @override
  String? get path => throw UnimplementedError();

  @override
  bool get lazy => throw UnimplementedError();
}

void main() {
  group('QuestionSessionService', () {
    late _FakeBox fakeBox;
    late QuestionSessionService service;

    setUp(() {
      fakeBox = _FakeBox();
      service = QuestionSessionService(fakeBox);
    });

    test('save session then load returns same state', () async {
      final session = QuestionSession(
        exerciseId: 'set-1',
        lessonId: 'lesson-1',
        currentIndex: 2,
        answers: {0: 'answer0', 1: 'answer1'},
        results: {
          0: {'isCorrect': true, 'score': 10},
          1: {'isCorrect': false, 'score': 0},
        },
        questions: [
          {'id': 'ex-1', 'question': 'Q1'},
          {'id': 'ex-2', 'question': 'Q2'},
        ],
      );

      await service.save(session);
      final loaded = await service.load('set-1');

      expect(loaded, isNotNull);
      expect(loaded!.exerciseId, 'set-1');
      expect(loaded.lessonId, 'lesson-1');
      expect(loaded.currentIndex, 2);
      expect(loaded.answers, {0: 'answer0', 1: 'answer1'});
      expect(loaded.results, {
        0: {'isCorrect': true, 'score': 10},
        1: {'isCorrect': false, 'score': 0},
      });
      expect(loaded.questions.length, 2);
      expect(loaded.questions[0]['id'], 'ex-1');
    });

    test('delete session then load returns null', () async {
      final session = QuestionSession(
        exerciseId: 'set-2',
        lessonId: 'lesson-2',
        currentIndex: 0,
        answers: {},
        results: {},
        questions: [],
      );

      await service.save(session);
      expect(await service.load('set-2'), isNotNull);

      await service.delete('set-2');
      expect(await service.load('set-2'), isNull);
    });

    test('partial session preserves partial state', () async {
      final session = QuestionSession(
        exerciseId: 'set-3',
        lessonId: 'lesson-3',
        currentIndex: 1,
        answers: {0: 'partial'},
        results: {
          0: {'isCorrect': true, 'score': 5},
        },
        questions: [
          {'id': 'ex-1', 'question': 'Q1'},
          {'id': 'ex-2', 'question': 'Q2'},
        ],
      );

      await service.save(session);
      final loaded = await service.load('set-3');

      expect(loaded, isNotNull);
      expect(loaded!.currentIndex, 1);
      expect(loaded.answers, {0: 'partial'});
      expect(loaded.results, {
        0: {'isCorrect': true, 'score': 5},
      });
    });

    test('load non-existent session returns null', () async {
      final loaded = await service.load('non-existent');
      expect(loaded, isNull);
    });

    test('matching answers survive toMap/fromMap (Hive-safe)', () async {
      final exerciseJson = {
        'id': 'ex-1',
        'questionType': 'matching',
        'question': 'Match',
        'questionAudioUrl': null,
        'options': {
          'pairs': [
            {'left': 'A', 'right': '1'},
          ],
        },
        'correctAnswer': {
          'matches': [
            {'left': 'A', 'right': '1'},
          ],
        },
        'explanation': null,
        'orderIndex': 0,
      };
      final session = QuestionSession(
        exerciseId: 'set-match',
        lessonId: 'lesson-1',
        currentIndex: 0,
        answers: {
          0: [const MatchPair(left: 'A', right: '1')],
        },
        results: {},
        questions: [exerciseJson],
      );

      await service.save(session);
      final loaded = await service.load('set-match');

      expect(loaded, isNotNull);
      final a0 = loaded!.answers[0] as List<dynamic>;
      expect(a0.length, 1);
      expect(a0.first, isA<MatchPair>());
      expect((a0.first as MatchPair).left, 'A');
      expect((a0.first as MatchPair).right, '1');
    });

    test('save overwrites existing session', () async {
      final session1 = QuestionSession(
        exerciseId: 'set-4',
        lessonId: 'lesson-4',
        currentIndex: 0,
        answers: {},
        results: {},
        questions: [],
      );

      final session2 = QuestionSession(
        exerciseId: 'set-4',
        lessonId: 'lesson-4',
        currentIndex: 3,
        answers: {0: 'a', 1: 'b', 2: 'c'},
        results: {
          0: {'isCorrect': true, 'score': 1},
          1: {'isCorrect': true, 'score': 2},
          2: {'isCorrect': false, 'score': 0},
        },
        questions: [],
      );

      await service.save(session1);
      await service.save(session2);

      final loaded = await service.load('set-4');
      expect(loaded!.currentIndex, 3);
      expect(loaded.answers.length, 3);
    });

    test('updatedAt is set on save and newer than createdAt', () async {
      final before = DateTime.now();
      final session = QuestionSession(
        exerciseId: 'set-5',
        lessonId: 'lesson-5',
        currentIndex: 0,
        answers: {},
        results: {},
        questions: [],
      );

      await service.save(session);
      final loaded = await service.load('set-5');

      final after = DateTime.now();
      expect(loaded, isNotNull);
      expect(loaded!.createdAt, isNotNull);
      expect(loaded.updatedAt, isNotNull);
      expect(
        loaded.createdAt!.isAfter(before) || loaded.createdAt!.isAtSameMomentAs(before),
        isTrue,
      );
      expect(
        loaded.createdAt!.isBefore(after) || loaded.createdAt!.isAtSameMomentAs(after),
        isTrue,
      );
      expect(
        loaded.updatedAt!.isAfter(loaded.createdAt!) ||
            loaded.updatedAt!.isAtSameMomentAs(loaded.createdAt!),
        isTrue,
      );
    });
  });
}
