import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/simulation/domain/correction.dart';
import 'package:linvnix/features/simulation/domain/message_feedback.dart';
import 'package:linvnix/features/simulation/domain/simulation_message.dart';
import 'package:linvnix/features/simulation/domain/simulation_session.dart';
import 'package:linvnix/features/simulation/domain/create_session_response.dart';

void main() {
  group('Correction', () {
    test('creates from JSON correctly', () {
      final json = {
        'original': 'Xin chào',
        'corrected': 'Xin chào',
        'type': 'SPELLING',
        'severity': 'error',
        'startIndex': 0,
        'endIndex': 8,
      };

      final correction = Correction.fromJson(json);

      expect(correction.original, 'Xin chào');
      expect(correction.corrected, 'Xin chào');
      expect(correction.type, 'SPELLING');
      expect(correction.severity, 'error');
      expect(correction.startIndex, 0);
      expect(correction.endIndex, 8);
    });

    test('handles nullable fields with defaults', () {
      final json = <String, dynamic>{};

      final correction = Correction.fromJson(json);

      expect(correction.original, '');
      expect(correction.corrected, '');
      expect(correction.type, '');
      expect(correction.severity, '');
      expect(correction.startIndex, 0);
      expect(correction.endIndex, 0);
    });

    test('converts to JSON correctly', () {
      const correction = Correction(
        original: 'hello',
        corrected: 'Hello',
        type: 'SPELLING',
        severity: 'warning',
        startIndex: 5,
        endIndex: 10,
      );

      final json = correction.toJson();

      expect(json['original'], 'hello');
      expect(json['corrected'], 'Hello');
      expect(json['type'], 'SPELLING');
      expect(json['severity'], 'warning');
      expect(json['startIndex'], 5);
      expect(json['endIndex'], 10);
    });
  });

  group('MessageFeedback', () {
    test('creates from JSON with corrections and review', () {
      final json = {
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
        'review': 'Good attempt!',
        'reviewAvailable': true,
      };

      final feedback = MessageFeedback.fromJson(json);

      expect(feedback.corrections, hasLength(1));
      expect(feedback.corrections[0].original, 'toi');
      expect(feedback.review, 'Good attempt!');
      expect(feedback.reviewAvailable, true);
    });

    test('handles null feedback fields', () {
      final json = <String, dynamic>{};

      final feedback = MessageFeedback.fromJson(json);

      expect(feedback.corrections, isEmpty);
      expect(feedback.review, isNull);
      expect(feedback.reviewAvailable, false);
    });

    test('converts to JSON correctly', () {
      const feedback = MessageFeedback(
        corrections: [
          Correction(
            original: 'toi',
            corrected: 'tôi',
            type: 'SPELLING',
            severity: 'error',
            startIndex: 0,
            endIndex: 3,
          ),
        ],
        review: 'Good attempt!',
        reviewAvailable: true,
      );

      final json = feedback.toJson();

      expect(json['corrections'], hasLength(1));
      expect(json['review'], 'Good attempt!');
      expect(json['reviewAvailable'], true);
    });
  });

  group('SimulationMessage', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'msg-1',
        'speakerCharacterId': 'char-1',
        'speakerName': 'Lan',
        'isLearner': false,
        'content': 'Xin chào!',
        'feedback': {
          'corrections': [],
          'review': null,
          'reviewAvailable': false,
        },
        'orderIndex': 0,
      };

      final message = SimulationMessage.fromJson(json);

      expect(message.id, 'msg-1');
      expect(message.speakerCharacterId, 'char-1');
      expect(message.speakerName, 'Lan');
      expect(message.isLearner, false);
      expect(message.content, 'Xin chào!');
      expect(message.feedback, isNotNull);
      expect(message.feedback!.corrections, isEmpty);
      expect(message.orderIndex, 0);
    });

    test('handles null feedback and nullable fields', () {
      final json = {
        'id': 'msg-2',
        'isLearner': true,
        'content': 'Hello',
        'orderIndex': 1,
      };

      final message = SimulationMessage.fromJson(json);

      expect(message.speakerCharacterId, isNull);
      expect(message.speakerName, '');
      expect(message.isLearner, true);
      expect(message.feedback, isNull);
    });

    test('converts to JSON correctly', () {
      const message = SimulationMessage(
        id: 'msg-1',
        speakerCharacterId: 'char-1',
        speakerName: 'Lan',
        isLearner: false,
        content: 'Xin chào!',
        orderIndex: 0,
      );

      final json = message.toJson();

      expect(json['id'], 'msg-1');
      expect(json['speakerCharacterId'], 'char-1');
      expect(json['speakerName'], 'Lan');
      expect(json['isLearner'], false);
      expect(json['content'], 'Xin chào!');
      expect(json['orderIndex'], 0);
    });
  });

  group('SimulationSession', () {
    test('creates from JSON correctly', () {
      final json = {
        'id': 'session-1',
        'scenarioId': 'scenario-1',
        'chosenCharacterId': 'char-1',
        'status': 'ACTIVE',
        'nextTurnCharacterId': 'char-1',
      };

      final session = SimulationSession.fromJson(json);

      expect(session.id, 'session-1');
      expect(session.scenarioId, 'scenario-1');
      expect(session.chosenCharacterId, 'char-1');
      expect(session.status, 'ACTIVE');
      expect(session.nextTurnCharacterId, 'char-1');
    });

    test('handles defaults for missing fields', () {
      final json = {'id': 'session-1'};

      final session = SimulationSession.fromJson(json);

      expect(session.scenarioId, '');
      expect(session.chosenCharacterId, '');
      expect(session.status, 'ACTIVE');
      expect(session.nextTurnCharacterId, '');
    });

    test('converts to JSON correctly', () {
      const session = SimulationSession(
        id: 'session-1',
        scenarioId: 'scenario-1',
        chosenCharacterId: 'char-1',
        status: 'COMPLETED',
        nextTurnCharacterId: 'char-1',
      );

      final json = session.toJson();

      expect(json['id'], 'session-1');
      expect(json['scenarioId'], 'scenario-1');
      expect(json['chosenCharacterId'], 'char-1');
      expect(json['status'], 'COMPLETED');
      expect(json['nextTurnCharacterId'], 'char-1');
    });
  });

  group('CreateSessionResponse', () {
    test('creates from JSON with messages array', () {
      final json = {
        'session': {
          'id': 'session-1',
          'scenarioId': 'scenario-1',
          'chosenCharacterId': 'char-1',
          'status': 'ACTIVE',
          'nextTurnCharacterId': 'char-1',
        },
        'messages': [
          {
            'id': 'msg-1',
            'speakerCharacterId': null,
            'speakerName': 'Narrator',
            'isLearner': false,
            'content': 'Scene begins...',
            'orderIndex': 0,
          },
        ],
        'nextTurnCharacterId': 'char-1',
      };

      final response = CreateSessionResponse.fromJson(json);

      expect(response.session.id, 'session-1');
      expect(response.messages, hasLength(1));
      expect(response.messages[0].content, 'Scene begins...');
      expect(response.nextTurnCharacterId, 'char-1');
    });

    test('creates from JSON with openingMessage (backend current format)', () {
      final json = {
        'session': {
          'id': 'session-1',
          'scenarioId': 'scenario-1',
          'chosenCharacterId': 'char-1',
          'status': 'ACTIVE',
          'nextTurnCharacterId': 'char-1',
        },
        'openingMessage': {
          'id': 'msg-1',
          'speakerCharacterId': null,
          'speakerName': '',
          'isLearner': false,
          'content': 'Welcome!',
          'orderIndex': 0,
        },
      };

      final response = CreateSessionResponse.fromJson(json);

      expect(response.session.id, 'session-1');
      expect(response.messages, hasLength(1));
      expect(response.messages[0].content, 'Welcome!');
      expect(response.nextTurnCharacterId, 'char-1');
    });

    test('handles null openingMessage and empty messages', () {
      final json = {
        'session': {
          'id': 'session-1',
          'scenarioId': 'scenario-1',
          'chosenCharacterId': 'char-1',
          'status': 'ACTIVE',
          'nextTurnCharacterId': 'char-1',
        },
      };

      final response = CreateSessionResponse.fromJson(json);

      expect(response.messages, isEmpty);
      expect(response.nextTurnCharacterId,
          'char-1');
    });
  });
}
