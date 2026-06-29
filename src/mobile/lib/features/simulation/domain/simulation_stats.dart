class SimulationStats {
  const SimulationStats({
    required this.scenariosAttempted,
    required this.averageScore,
  });

  factory SimulationStats.fromJson(Map<String, dynamic> json) {
    return SimulationStats(
      scenariosAttempted: (json['scenariosAttempted'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
    );
  }

  final int scenariosAttempted;
  final double averageScore;

  Map<String, dynamic> toJson() {
    return {
      'scenariosAttempted': scenariosAttempted,
      'averageScore': averageScore,
    };
  }
}
