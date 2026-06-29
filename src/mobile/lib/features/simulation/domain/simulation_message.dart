import 'message_feedback.dart';

class SimulationMessage {
  const SimulationMessage({
    required this.id,
    this.speakerCharacterId,
    required this.speakerName,
    required this.isLearner,
    required this.content,
    this.translation,
    this.feedback,
    required this.orderIndex,
  });

  factory SimulationMessage.fromJson(Map<String, dynamic> json) {
    final id = json['id'] as String?;
    return SimulationMessage(
      id: id ?? 'msg-${json.hashCode}-${json['content'] ?? ''}',
      speakerCharacterId: json['speakerCharacterId'] as String?,
      speakerName: json['speakerName'] as String? ?? '',
      isLearner: json['isLearner'] as bool? ?? false,
      content: json['content'] as String? ?? '',
      translation: json['translation'] as String?,
      feedback: json['feedback'] == null
          ? null
          : MessageFeedback.fromJson(
              json['feedback'] as Map<String, dynamic>,
            ),
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    );
  }

  final String id;
  final String? speakerCharacterId;
  final String speakerName;
  final bool isLearner;
  final String content;
  final String? translation;
  final MessageFeedback? feedback;
  final int orderIndex;

  Map<String, dynamic> toJson() => {
        'id': id,
        'speakerCharacterId': speakerCharacterId,
        'speakerName': speakerName,
        'isLearner': isLearner,
        'content': content,
        'translation': translation,
        'feedback': feedback?.toJson(),
        'orderIndex': orderIndex,
      };
}
