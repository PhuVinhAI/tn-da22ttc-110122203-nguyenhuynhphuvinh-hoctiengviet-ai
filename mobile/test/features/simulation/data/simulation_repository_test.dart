import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:linvnix/features/simulation/data/simulation_repository.dart';
import 'package:linvnix/core/exceptions/app_exception.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late SimulationRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = SimulationRepository(mockDio);
  });

  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('SimulationRepository', () {
    group('createSession', () {
      const scenarioId = 'scenario-1';
      const chosenCharacterId = 'char-1';

      test('returns CreateSessionResponse on success', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/simulations/sessions'),
            statusCode: 201,
            data: {
              'session': {
                'id': 'session-1',
                'scenarioId': scenarioId,
                'chosenCharacterId': chosenCharacterId,
                'status': 'ACTIVE',
                'nextTurnCharacterId': chosenCharacterId,
              },
              'openingMessage': {
                'id': 'msg-1',
                'speakerCharacterId': null,
                'speakerName': '',
                'isLearner': false,
                'content': 'Welcome to the market!',
                'orderIndex': 0,
              },
            },
          ),
        );

        final result =
            await repository.createSession(scenarioId, chosenCharacterId);

        expect(result.session.id, 'session-1');
        expect(result.session.scenarioId, scenarioId);
        expect(result.messages, hasLength(1));
        expect(result.messages[0].content, 'Welcome to the market!');
        expect(result.nextTurnCharacterId, chosenCharacterId);
      });

      test('sends correct body and uses extended timeout', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(path: '/simulations/sessions'),
            statusCode: 201,
            data: {
              'session': {
                'id': 'session-1',
                'scenarioId': scenarioId,
                'chosenCharacterId': chosenCharacterId,
                'status': 'ACTIVE',
                'nextTurnCharacterId': chosenCharacterId,
              },
            },
          ),
        );

        await repository.createSession(scenarioId, chosenCharacterId);

        verify(() => mockDio.post<Map<String, dynamic>>(
              '/simulations/sessions',
              data: {
                'scenarioId': scenarioId,
                'chosenCharacterId': chosenCharacterId,
              },
              options: any(named: 'options'),
            )).called(1);
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/simulations/sessions'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.createSession(scenarioId, chosenCharacterId),
          throwsA(isA<NetworkException>()),
        );
      });

      test('throws ValidationException on 409 conflict', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(path: '/simulations/sessions'),
            response: Response(
              requestOptions: RequestOptions(path: '/simulations/sessions'),
              statusCode: 409,
              data: {'message': 'Already has active session'},
            ),
            type: DioExceptionType.badResponse,
          ),
        );

        expect(
          () => repository.createSession(scenarioId, chosenCharacterId),
          throwsA(isA<ValidationException>()),
        );
      });
    });

    group('sendMessage', () {
      const sessionId = 'session-1';
      const content = 'Xin chào';

      test('calls POST /simulations/sessions/:id/messages with extended timeout',
          () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(
                path: '/simulations/sessions/$sessionId/messages'),
            statusCode: 200,
            data: {
              'messages': [
                {
                  'id': 'msg-1',
                  'speakerCharacterId': 'npc-1',
                  'speakerName': 'Lan',
                  'isLearner': false,
                  'content': 'Chào bạn!',
                  'orderIndex': 0,
                },
              ],
              'nextTurnCharacterId': 'char-learner',
              'sessionEnded': false,
            },
          ),
        );

        final result = await repository.sendMessage(sessionId, content);

        verify(() => mockDio.post<Map<String, dynamic>>(
              '/simulations/sessions/$sessionId/messages',
              data: {'content': content},
              options: any(named: 'options'),
            )).called(1);

        expect(result.messages, hasLength(1));
        expect(result.messages[0].speakerName, 'Lan');
        expect(result.nextTurnCharacterId, 'char-learner');
        expect(result.sessionEnded, false);
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenThrow(
          DioException(
            requestOptions: RequestOptions(
                path: '/simulations/sessions/$sessionId/messages'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.sendMessage(sessionId, content),
          throwsA(isA<NetworkException>()),
        );
      });

      test('parses sessionEnded with endReason and result', () async {
        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenAnswer(
          (_) async => Response(
            requestOptions: RequestOptions(
                path: '/simulations/sessions/$sessionId/messages'),
            statusCode: 200,
            data: {
              'messages': [],
              'nextTurnCharacterId': '',
              'sessionEnded': true,
              'endReason': 'COMPLETED',
              'result': {'totalScore': 85},
            },
          ),
        );

        final result = await repository.sendMessage(sessionId, content);

        expect(result.sessionEnded, true);
        expect(result.endReason, 'COMPLETED');
        expect(result.result, isNotNull);
        expect(result.result!['totalScore'], 85);
      });
    });

    group('cancelSession', () {
      const sessionId = 'session-1';

      test('calls DELETE /simulations/sessions/:id', () async {
        when(() => mockDio.delete<void>(any())).thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/simulations/sessions/$sessionId'),
            statusCode: 200,
            data: null,
          ),
        );

        await repository.cancelSession(sessionId);

        verify(() => mockDio.delete<void>(
              '/simulations/sessions/$sessionId',
            )).called(1);
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.delete<void>(any())).thenThrow(
          DioException(
            requestOptions:
                RequestOptions(path: '/simulations/sessions/$sessionId'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.cancelSession(sessionId),
          throwsA(isA<NetworkException>()),
        );
      });
    });

    group('getSession', () {
      const sessionId = 'session-1';

      test('calls GET /simulations/sessions/:id and returns SessionWithMessages',
          () async {
        when(() => mockDio.get<Map<String, dynamic>>(any()))
            .thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/simulations/sessions/$sessionId'),
            statusCode: 200,
            data: {
              'session': {
                'id': sessionId,
                'scenarioId': 'scenario-1',
                'chosenCharacterId': 'char-1',
                'status': 'ACTIVE',
                'nextTurnCharacterId': 'char-1',
              },
              'messages': [
                {
                  'id': 'msg-1',
                  'speakerCharacterId': 'npc-1',
                  'speakerName': 'Lan',
                  'isLearner': false,
                  'content': 'Chào!',
                  'orderIndex': 0,
                },
              ],
            },
          ),
        );

        final result = await repository.getSession(sessionId);

        verify(() => mockDio.get<Map<String, dynamic>>(
              '/simulations/sessions/$sessionId',
            )).called(1);

        expect(result.session.id, sessionId);
        expect(result.session.status, 'ACTIVE');
        expect(result.messages, hasLength(1));
        expect(result.messages[0].content, 'Chào!');
      });

      test('handles response without messages array', () async {
        when(() => mockDio.get<Map<String, dynamic>>(any()))
            .thenAnswer(
          (_) async => Response(
            requestOptions:
                RequestOptions(path: '/simulations/sessions/$sessionId'),
            statusCode: 200,
            data: {
              'id': sessionId,
              'scenarioId': 'scenario-1',
              'chosenCharacterId': 'char-1',
              'status': 'PAUSED',
              'nextTurnCharacterId': 'char-1',
            },
          ),
        );

        final result = await repository.getSession(sessionId);

        expect(result.session.id, sessionId);
        expect(result.session.status, 'PAUSED');
        expect(result.messages, isEmpty);
      });

      test('throws NetworkException on connection timeout', () async {
        when(() => mockDio.get<Map<String, dynamic>>(any())).thenThrow(
          DioException(
            requestOptions:
                RequestOptions(path: '/simulations/sessions/$sessionId'),
            type: DioExceptionType.connectionTimeout,
          ),
        );

        expect(
          () => repository.getSession(sessionId),
          throwsA(isA<NetworkException>()),
        );
      });
    });
  });
}
