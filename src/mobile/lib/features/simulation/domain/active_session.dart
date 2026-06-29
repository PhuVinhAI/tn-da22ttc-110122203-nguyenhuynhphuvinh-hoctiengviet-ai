class ActiveSession {
  const ActiveSession({
    required this.id,
    required this.scenarioId,
    required this.scenarioTitle,
    required this.chosenCharacterId,
    required this.chosenCharacterName,
    required this.status,
    required this.nextTurnCharacterId,
  });

  factory ActiveSession.fromJson(Map<String, dynamic> json) {
    return ActiveSession(
      id: json['id'] as String,
      scenarioId: json['scenarioId'] as String? ?? '',
      scenarioTitle: json['scenarioTitle'] as String? ?? '',
      chosenCharacterId: json['chosenCharacterId'] as String? ?? '',
      chosenCharacterName: json['chosenCharacterName'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      nextTurnCharacterId: json['nextTurnCharacterId'] as String? ?? '',
    );
  }

  final String id;
  final String scenarioId;
  final String scenarioTitle;
  final String chosenCharacterId;
  final String chosenCharacterName;
  final String status;
  final String nextTurnCharacterId;
}
