import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/simulation/domain/send_message_response.dart';

void main() {
  test('parses backend sendMessage response without message ids', () {
    final json = {
      'messages': [
        {
          'speakerCharacterId': 'npc-1',
          'speakerName': 'Chị Hà',
          'content': 'Chào em!',
        },
      ],
      'nextTurnCharacterId': 'char-learner',
      'feedback': {
        'corrections': [],
        'review': null,
        'reviewAvailable': false,
      },
      'sessionEnded': false,
    };

    expect(
      () => SendMessageResponse.fromJson(json),
      returnsNormally,
    );
  });
}
