import 'question_models.dart';
import 'question_renderer.dart';
import 'question_renderers/multiple_choice_renderer.dart';
import 'question_renderers/fill_blank_renderer.dart';
import 'question_renderers/matching_renderer.dart';
import 'question_renderers/ordering_renderer.dart';
import 'question_renderers/translation_renderer.dart';
import 'question_renderers/listening_renderer.dart';
import 'question_renderers/speaking_renderer.dart';

const _renderers = <QuestionType, QuestionRenderer>{
  QuestionType.multipleChoice: MultipleChoiceRenderer(),
  QuestionType.fillBlank: FillBlankRenderer(),
  QuestionType.matching: MatchingRenderer(),
  QuestionType.ordering: OrderingRenderer(),
  QuestionType.translation: TranslationRenderer(),
  QuestionType.listening: ListeningRenderer(),
  QuestionType.speaking: SpeakingRenderer(),
};

QuestionRenderer getRenderer(QuestionType type) {
  return _renderers[type] ?? const MultipleChoiceRenderer();
}
