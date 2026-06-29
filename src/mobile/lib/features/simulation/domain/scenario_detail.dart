import 'scenario_character.dart';
import 'scenario_summary.dart';
import 'scoring_criterion.dart';

class ScenarioDetail {
  const ScenarioDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.requiredLevel,
    required this.difficulty,
    required this.estimatedMinutes,
    required this.characterCount,
    required this.scoringCriteria,
    required this.characters,
    this.categoryInfo,
  });

  factory ScenarioDetail.fromJson(Map<String, dynamic> json) {
    final categoryJson = json['categoryInfo'] ?? json['category'];
    final characters = (json['characters'] as List<dynamic>?)
            ?.map((e) => ScenarioCharacter.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final characterCountFromApi = (json['characterCount'] as num?)?.toInt();
    final characterCount = characters.isNotEmpty
        ? characters.length
        : (characterCountFromApi ?? 0);

    return ScenarioDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      requiredLevel: json['requiredLevel'] as String? ?? 'A1',
      difficulty: json['difficulty'] as String? ?? 'MEDIUM',
      estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt() ?? 5,
      characterCount: characterCount,
      scoringCriteria: (json['scoringCriteria'] as List<dynamic>?)
              ?.map((e) => ScoringCriterion.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      characters: characters,
      categoryInfo: categoryJson == null
          ? null
          : CategoryInfo.fromJson(categoryJson as Map<String, dynamic>),
    );
  }

  final String id;
  final String title;
  final String description;
  final String requiredLevel;
  final String difficulty;
  final int estimatedMinutes;
  final int characterCount;
  final List<ScoringCriterion> scoringCriteria;
  final List<ScenarioCharacter> characters;
  final CategoryInfo? categoryInfo;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'requiredLevel': requiredLevel,
        'difficulty': difficulty,
        'estimatedMinutes': estimatedMinutes,
        'characterCount': characterCount,
        'scoringCriteria': scoringCriteria.map((e) => e.toJson()).toList(),
        'characters': characters.map((e) => e.toJson()).toList(),
        'categoryInfo': categoryInfo?.toJson(),
      };
}
