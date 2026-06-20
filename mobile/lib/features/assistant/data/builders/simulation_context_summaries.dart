import '../../../simulation/domain/scenario_character.dart';
import '../../../simulation/domain/scenario_detail.dart';
import '../../../simulation/domain/scoring_criterion.dart';
import '../../../simulation/domain/simulation_result_detail.dart';
import '../../../simulation/domain/simulation_result_summary.dart';

/// Compact scenario detail for assistant screen context. `category` is
/// deliberately omitted — the scenario-detail screen does not render it,
/// and including it here would suggest a UI element to the assistant
/// that the learner cannot see.
Map<String, dynamic> scenarioDetailContextSummary(ScenarioDetail detail) {
  return {
    'id': detail.id,
    'title': detail.title,
    'description': detail.description,
    'requiredLevel': detail.requiredLevel,
    'difficulty': detail.difficulty,
    'estimatedMinutes': detail.estimatedMinutes,
    'characterCount': detail.characterCount,
  };
}

/// Compact playable character for assistant screen context.
Map<String, dynamic> scenarioCharacterContextSummary(ScenarioCharacter c) {
  return {
    'id': c.id,
    'name': c.name,
    'role': c.role,
    if (c.personality.isNotEmpty) 'personality': c.personality,
    if (c.speechStyle.isNotEmpty) 'speechStyle': c.speechStyle,
    'isPlayable': c.isPlayable,
  };
}

/// Compact scoring criterion (the rubric the AI will be graded on).
Map<String, dynamic> scoringCriterionContextSummary(ScoringCriterion sc) {
  return {
    'name': sc.name,
    'description': sc.description,
    'weight': sc.weight,
  };
}

/// Compact per-criterion result entry (post-conversation).
Map<String, dynamic> criteriaScoreContextSummary(CriteriaScore cs) {
  return {
    'name': cs.name,
    'score': cs.score,
    if (cs.comment != null && cs.comment!.isNotEmpty) 'comment': cs.comment,
  };
}

/// Compact simulation-result summary used in list/history views.
Map<String, dynamic> simulationResultSummaryContextSummary(
  SimulationResultSummary r,
) {
  return {
    'id': r.id,
    'totalScore': r.totalScore,
    'endReason': r.endReason,
    if (r.createdAt != null) 'createdAt': r.createdAt,
    if (r.scenarioTitle != null) 'scenarioTitle': r.scenarioTitle,
    if (r.characterName != null) 'characterName': r.characterName,
    if (r.scenarioId != null) 'scenarioId': r.scenarioId,
  };
}
