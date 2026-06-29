class ScoringCriterion {
  const ScoringCriterion({
    required this.name,
    required this.description,
    required this.weight,
  });

  factory ScoringCriterion.fromJson(Map<String, dynamic> json) {
    return ScoringCriterion(
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      weight: (json['weight'] as num?)?.toInt() ?? 0,
    );
  }

  final String name;
  final String description;
  final int weight;

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'weight': weight,
      };
}
