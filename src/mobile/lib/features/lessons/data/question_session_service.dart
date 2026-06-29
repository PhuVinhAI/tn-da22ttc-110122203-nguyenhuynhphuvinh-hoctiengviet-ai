import 'package:hive/hive.dart';
import '../domain/question_session.dart';

class QuestionSessionService {
  QuestionSessionService(this._box);

  final Box<Map<dynamic, dynamic>> _box;

  Future<void> save(QuestionSession session) async {
    final map = session.toMap();
    await _box.put(session.exerciseId, map);
  }

  Future<QuestionSession?> load(String exerciseId) async {
    final raw = _box.get(exerciseId);
    if (raw == null) return null;
    return QuestionSession.fromMap(raw);
  }

  Future<void> delete(String exerciseId) async {
    await _box.delete(exerciseId);
  }

  Future<void> clearAll() async {
    await _box.clear();
  }
}
