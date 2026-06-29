import 'question_models.dart';

/// Hive only accepts Map/List/String/num/bool/null. Renderers may hold Dart-only
/// state (e.g. [MatchPair]) and must be encoded to JSON before writing the box.
class QuestionSessionCodec {
  static Map<String, dynamic> encodeAnswers(
    Map<int, dynamic> answers,
    List<Map<String, dynamic>> exercisesJson,
  ) {
    final out = <String, dynamic>{};
    for (final entry in answers.entries) {
      final idx = entry.key;
      final raw = entry.value;
      if (idx < 0 || idx >= exercisesJson.length) {
        out[idx.toString()] = _encodeUnknown(raw);
        continue;
      }
      final typeField = exercisesJson[idx]['questionType'];
      if (typeField is! String) {
        out[idx.toString()] = _encodeUnknown(raw);
        continue;
      }
      final type = QuestionType.fromString(typeField);
      out[idx.toString()] = encodeAnswerForType(type, raw);
    }
    return out;
  }

  static Map<int, dynamic> decodeAnswers(
    Map<dynamic, dynamic>? raw,
    List<Map<String, dynamic>> exercisesJson,
  ) {
    if (raw == null || raw.isEmpty) return {};
    int parseKey(dynamic k) {
      if (k is int) return k;
      if (k is num) return k.toInt();
      if (k is String) return int.tryParse(k) ?? 0;
      return 0;
    }

    final out = <int, dynamic>{};
    for (final e in raw.entries) {
      final idx = parseKey(e.key);
      if (idx < 0 || idx >= exercisesJson.length) {
        out[idx] = e.value;
        continue;
      }
      final typeField = exercisesJson[idx]['questionType'];
      if (typeField is! String) {
        out[idx] = e.value;
        continue;
      }
      final type = QuestionType.fromString(typeField);
      out[idx] = decodeAnswerForType(type, e.value);
    }
    return out;
  }

  static dynamic encodeAnswerForType(QuestionType type, dynamic answer) {
    switch (type) {
      case QuestionType.matching:
        if (answer is List<MatchPair>) {
          return answer.map((m) => m.toJson()).toList();
        }
        if (answer is List) {
          return answer.map(_encodeUnknown).toList();
        }
        return answer;
      case QuestionType.ordering:
      case QuestionType.fillBlank:
        if (answer is List) {
          return answer.map((e) => '$e').toList();
        }
        return answer;
      case QuestionType.multipleChoice:
      case QuestionType.translation:
      case QuestionType.listening:
      case QuestionType.speaking:
        return answer;
    }
  }

  static dynamic decodeAnswerForType(QuestionType type, dynamic raw) {
    switch (type) {
      case QuestionType.matching:
        if (raw is List) {
          return raw
              .map(
                (e) => MatchPair.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList();
        }
        return raw;
      case QuestionType.ordering:
      case QuestionType.fillBlank:
        if (raw is List) {
          return raw.map((e) => e as String).toList();
        }
        return raw;
      case QuestionType.multipleChoice:
      case QuestionType.translation:
      case QuestionType.listening:
      case QuestionType.speaking:
        return raw;
    }
  }

  static dynamic _encodeUnknown(dynamic v) {
    if (v is MatchPair) return v.toJson();
    if (v is List) {
      return v.map(_encodeUnknown).toList();
    }
    if (v is Map) {
      return v.map((k, val) => MapEntry(k.toString(), _encodeUnknown(val)));
    }
    return v;
  }
}
