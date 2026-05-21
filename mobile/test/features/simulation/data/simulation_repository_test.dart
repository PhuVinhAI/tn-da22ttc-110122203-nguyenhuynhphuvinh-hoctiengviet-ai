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
  });
}
