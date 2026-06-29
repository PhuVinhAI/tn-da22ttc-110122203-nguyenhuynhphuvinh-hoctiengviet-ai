import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/simulation/domain/send_message_response.dart';

void main() {
  group('SendMessageResponse', () {
    test('creates from JSON with all fields', () {
      final json = {
        'messages': [
          {
            'id': 'msg-1',
            'speakerCharacterId': 'npc-1',
            'speakerName': 'Lan',
            'isLearner': false,
            'content': 'Xin chào!',
            'orderIndex': 0,
          },
          {
            'id': 'msg-2',
            'speakerCharacterId': 'npc-2',
            'speakerName': 'Minh',
            'isLearner': false,
            'content': 'Chào bạn!',
            'orderIndex': 1,
          },
        ],
        'nextTurnCharacterId': 'char-learner',
        'feedback': {
          'corrections': [
            {
              'original': 'toi',
              'corrected': 'tôi',
              'type': 'SPELLING',
              'severity': 'error',
              'startIndex': 0,
              'endIndex': 3,
            },
          ],
          'review': 'Good try!',
          'reviewAvailable': true,
        },
        'sessionEnded': false,
        'endReason': null,
        'result': null,
      };

      final response = SendMessageResponse.fromJson(json);

      expect(response.messages, hasLength(2));
      expect(response.messages[0].speakerName, 'Lan');
      expect(response.messages[1].speakerName, 'Minh');
      expect(response.nextTurnCharacterId, 'char-learner');
      expect(response.feedback, isNotNull);
      expect(response.feedback!.corrections, hasLength(1));
      expect(response.feedback!.review, 'Good try!');
      expect(response.sessionEnded, false);
      expect(response.endReason, isNull);
      expect(response.result, isNull);
    });

    test('creates from JSON with sessionEnded and endReason', () {
      final json = {
        'messages': [],
        'nextTurnCharacterId': '',
        'sessionEnded': true,
        'endReason': 'COMPLETED',
        'result': {'totalScore': 85},
      };

      final response = SendMessageResponse.fromJson(json);

      expect(response.messages, isEmpty);
      expect(response.sessionEnded, true);
      expect(response.endReason, 'COMPLETED');
      expect(response.result, isNotNull);
      expect(response.result!['totalScore'], 85);
    });

    test('handles nullable fields with defaults', () {
      final json = <String, dynamic>{};

      final response = SendMessageResponse.fromJson(json);

      expect(response.messages, isEmpty);
      expect(response.nextTurnCharacterId, '');
      expect(response.feedback, isNull);
      expect(response.sessionEnded, false);
      expect(response.endReason, isNull);
      expect(response.result, isNull);
    });

    test('converts to JSON correctly', () {
      const response = SendMessageResponse(
        messages: [],
        nextTurnCharacterId: 'char-1',
        sessionEnded: false,
      );

      final json = response.toJson();

      expect(json['messages'], isEmpty);
      expect(json['nextTurnCharacterId'], 'char-1');
      expect(json['feedback'], isNull);
      expect(json['sessionEnded'], false);
      expect(json['endReason'], isNull);
      expect(json['result'], isNull);
    });

    test('handles messages as null', () {
      final json = {
        'nextTurnCharacterId': 'char-1',
        'sessionEnded': false,
      };

      final response = SendMessageResponse.fromJson(json);

      expect(response.messages, isEmpty);
    });
  });
}
