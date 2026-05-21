import 'simulation_session.dart';
import 'simulation_message.dart';

class CreateSessionResponse {
  const CreateSessionResponse({
    required this.session,
    required this.messages,
    required this.nextTurnCharacterId,
  });

  factory CreateSessionResponse.fromJson(Map<String, dynamic> json) {
    final session = SimulationSession.fromJson(
      json['session'] as Map<String, dynamic>,
    );

    List<SimulationMessage> messages;
    if (json['messages'] != null) {
      messages = (json['messages'] as List<dynamic>)
          .map((e) => SimulationMessage.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (json['openingMessage'] != null) {
      messages = [
        SimulationMessage.fromJson(
          json['openingMessage'] as Map<String, dynamic>,
        ),
      ];
    } else {
      messages = [];
    }

    return CreateSessionResponse(
      session: session,
      messages: messages,
      nextTurnCharacterId:
          json['nextTurnCharacterId'] as String? ??
          session.nextTurnCharacterId,
    );
  }

  final SimulationSession session;
  final List<SimulationMessage> messages;
  final String nextTurnCharacterId;

  Map<String, dynamic> toJson() => {
        'session': session.toJson(),
        'messages': messages.map((e) => e.toJson()).toList(),
        'nextTurnCharacterId': nextTurnCharacterId,
      };
}
