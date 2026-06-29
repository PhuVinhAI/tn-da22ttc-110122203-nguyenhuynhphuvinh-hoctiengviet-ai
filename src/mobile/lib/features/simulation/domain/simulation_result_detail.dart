class CriteriaScore {
  const CriteriaScore({
    required this.name,
    required this.score,
    this.comment,
  });

  factory CriteriaScore.fromJson(Map<String, dynamic> json) {
    return CriteriaScore(
      name: json['name'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0,
      comment: json['comment'] as String?,
    );
  }

  final String name;
  final double score;
  final String? comment;

  Map<String, dynamic> toJson() => {
        'name': name,
        'score': score,
        'comment': comment,
      };
}

class SimulationResultDetail {
  const SimulationResultDetail({
    required this.id,
    required this.sessionId,
    required this.scenarioId,
    required this.chosenCharacterId,
    required this.totalScore,
    required this.criteriaScores,
    required this.endReason,
    this.aiSummary,
    this.totalMessages = 0,
    this.createdAt,
    this.scenarioTitle,
    this.characterName,
  });

  factory SimulationResultDetail.fromJson(Map<String, dynamic> json) {
    List<CriteriaScore> criteriaScores;
    if (json['criteriaScores'] != null) {
      criteriaScores = (json['criteriaScores'] as List<dynamic>)
          .map((e) => CriteriaScore.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      criteriaScores = [];
    }

    String? scenarioTitle;
    if (json['scenario'] != null && json['scenario'] is Map) {
      scenarioTitle =
          (json['scenario'] as Map<String, dynamic>)['title'] as String?;
    }
    scenarioTitle ??= json['scenarioTitle'] as String?;

    String? characterName;
    if (json['chosenCharacter'] != null && json['chosenCharacter'] is Map) {
      characterName =
          (json['chosenCharacter'] as Map<String, dynamic>)['name'] as String?;
    }
    characterName ??= json['chosenCharacterName'] as String?;

    return SimulationResultDetail(
      id: json['id'] as String,
      sessionId: json['sessionId'] as String? ?? '',
      scenarioId: json['scenarioId'] as String? ?? '',
      chosenCharacterId: json['chosenCharacterId'] as String? ?? '',
      totalScore: (json['totalScore'] as num?)?.toDouble() ?? 0,
      criteriaScores: criteriaScores,
      endReason: json['endReason'] as String? ?? 'COMPLETED',
      aiSummary: json['aiSummary'] as String?,
      totalMessages: (json['totalMessages'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] as String?,
      scenarioTitle: scenarioTitle,
      characterName: characterName,
    );
  }

  final String id;
  final String sessionId;
  final String scenarioId;
  final String chosenCharacterId;
  final double totalScore;
  final List<CriteriaScore> criteriaScores;
  final String endReason;
  final String? aiSummary;
  final int totalMessages;
  final String? createdAt;
  final String? scenarioTitle;
  final String? characterName;

  bool get isCompleted => endReason == 'COMPLETED';
  bool get isTooManyErrors => endReason == 'TOO_MANY_ERRORS';
  bool get isInappropriate => endReason == 'INAPPROPRIATE' || endReason == 'ABUSIVE';
  bool get canReplay => isCompleted;

  Map<String, dynamic> toJson() => {
        'id': id,
        'sessionId': sessionId,
        'scenarioId': scenarioId,
        'chosenCharacterId': chosenCharacterId,
        'totalScore': totalScore,
        'criteriaScores': criteriaScores.map((e) => e.toJson()).toList(),
        'endReason': endReason,
        'aiSummary': aiSummary,
        'totalMessages': totalMessages,
        'createdAt': createdAt,
        'scenarioTitle': scenarioTitle,
        'characterName': characterName,
      };
}
