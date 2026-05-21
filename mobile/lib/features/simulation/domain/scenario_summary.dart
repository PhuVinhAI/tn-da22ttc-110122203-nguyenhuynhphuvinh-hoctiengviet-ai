class CategoryInfo {
  const CategoryInfo({
    required this.id,
    required this.name,
  });

  factory CategoryInfo.fromJson(Map<String, dynamic> json) {
    return CategoryInfo(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }

  final String id;
  final String name;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
      };
}

class ScenarioSummary {
  const ScenarioSummary({
    required this.id,
    required this.title,
    required this.description,
    required this.requiredLevel,
    required this.difficulty,
    required this.estimatedMinutes,
    required this.characterCount,
    this.categoryInfo,
  });

  factory ScenarioSummary.fromJson(Map<String, dynamic> json) {
    return ScenarioSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      requiredLevel: json['requiredLevel'] as String? ?? 'A1',
      difficulty: json['difficulty'] as String? ?? 'MEDIUM',
      estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt() ?? 5,
      characterCount: (json['characterCount'] as num?)?.toInt() ?? 0,
      categoryInfo: json['categoryInfo'] == null
          ? null
          : CategoryInfo.fromJson(json['categoryInfo'] as Map<String, dynamic>),
    );
  }

  final String id;
  final String title;
  final String description;
  final String requiredLevel;
  final String difficulty;
  final int estimatedMinutes;
  final int characterCount;
  final CategoryInfo? categoryInfo;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'requiredLevel': requiredLevel,
        'difficulty': difficulty,
        'estimatedMinutes': estimatedMinutes,
        'characterCount': characterCount,
        'categoryInfo': categoryInfo?.toJson(),
      };
}
