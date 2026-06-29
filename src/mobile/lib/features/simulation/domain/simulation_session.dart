class SimulationSession {
  const SimulationSession({
    required this.id,
    required this.scenarioId,
    required this.chosenCharacterId,
    required this.status,
    required this.nextTurnCharacterId,
  });

  factory SimulationSession.fromJson(Map<String, dynamic> json) {
    return SimulationSession(
      id: json['id'] as String,
      scenarioId: json['scenarioId'] as String? ?? '',
      chosenCharacterId: json['chosenCharacterId'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      nextTurnCharacterId: json['nextTurnCharacterId'] as String? ?? '',
    );
  }

  final String id;
  final String scenarioId;
  final String chosenCharacterId;
  final String status;
  final String nextTurnCharacterId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'scenarioId': scenarioId,
        'chosenCharacterId': chosenCharacterId,
        'status': status,
        'nextTurnCharacterId': nextTurnCharacterId,
      };
}
