import 'message_feedback.dart';
import 'simulation_message.dart';

class SendMessageResponse {
  const SendMessageResponse({
    required this.messages,
    required this.nextTurnCharacterId,
    this.feedback,
    required this.sessionEnded,
    this.endReason,
    this.result,
  });

  factory SendMessageResponse.fromJson(Map<String, dynamic> json) {
    List<SimulationMessage> messages;
    if (json['messages'] != null) {
      messages = (json['messages'] as List<dynamic>)
          .map((e) => SimulationMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      messages = [];
    }

    return SendMessageResponse(
      messages: messages,
      nextTurnCharacterId: json['nextTurnCharacterId'] as String? ?? '',
      feedback: json['feedback'] == null
          ? null
          : MessageFeedback.fromJson(
              json['feedback'] as Map<String, dynamic>,
            ),
      sessionEnded: json['sessionEnded'] as bool? ?? false,
      endReason: json['endReason'] as String?,
      result: json['result'] as Map<String, dynamic>?,
    );
  }

  final List<SimulationMessage> messages;
  final String nextTurnCharacterId;
  final MessageFeedback? feedback;
  final bool sessionEnded;
  final String? endReason;
  final Map<String, dynamic>? result;

  Map<String, dynamic> toJson() => {
        'messages': messages.map((e) => e.toJson()).toList(),
        'nextTurnCharacterId': nextTurnCharacterId,
        'feedback': feedback?.toJson(),
        'sessionEnded': sessionEnded,
        'endReason': endReason,
        'result': result,
      };
}
