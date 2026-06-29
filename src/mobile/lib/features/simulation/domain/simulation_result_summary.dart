class SimulationResultSummary {
  const SimulationResultSummary({
    required this.id,
    required this.totalScore,
    required this.endReason,
    this.createdAt,
    this.scenarioTitle,
    this.characterName,
    this.scenarioId,
  });

  factory SimulationResultSummary.fromJson(Map<String, dynamic> json) {
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

    String? scenarioId;
    if (json['scenario'] != null && json['scenario'] is Map) {
      scenarioId =
          (json['scenario'] as Map<String, dynamic>)['id'] as String?;
    }
    scenarioId ??= json['scenarioId'] as String?;

    return SimulationResultSummary(
      id: json['id'] as String,
      totalScore: (json['totalScore'] as num?)?.toDouble() ?? 0,
      endReason: json['endReason'] as String? ?? 'COMPLETED',
      createdAt: json['createdAt'] as String?,
      scenarioTitle: scenarioTitle,
      characterName: characterName,
      scenarioId: scenarioId,
    );
  }

  final String id;
  final double totalScore;
  final String endReason;
  final String? createdAt;
  final String? scenarioTitle;
  final String? characterName;
  final String? scenarioId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'totalScore': totalScore,
        'endReason': endReason,
        'createdAt': createdAt,
        'scenarioTitle': scenarioTitle,
        'characterName': characterName,
        'scenarioId': scenarioId,
      };
}
