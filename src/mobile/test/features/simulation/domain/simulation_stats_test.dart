import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/simulation/domain/simulation_stats.dart';

void main() {
  group('SimulationStats', () {
    test('creates from JSON correctly', () {
      final json = {
        'scenariosAttempted': 5,
        'averageScore': 72.5,
      };

      final stats = SimulationStats.fromJson(json);

      expect(stats.scenariosAttempted, 5);
      expect(stats.averageScore, 72.5);
    });

    test('handles zero values', () {
      final json = {
        'scenariosAttempted': 0,
        'averageScore': 0,
      };

      final stats = SimulationStats.fromJson(json);

      expect(stats.scenariosAttempted, 0);
      expect(stats.averageScore, 0.0);
    });

    test('handles missing fields with defaults', () {
      final json = <String, dynamic>{};

      final stats = SimulationStats.fromJson(json);

      expect(stats.scenariosAttempted, 0);
      expect(stats.averageScore, 0.0);
    });

    test('handles integer averageScore', () {
      final json = {
        'scenariosAttempted': 3,
        'averageScore': 85,
      };

      final stats = SimulationStats.fromJson(json);

      expect(stats.scenariosAttempted, 3);
      expect(stats.averageScore, 85.0);
    });

    test('converts to JSON correctly', () {
      const stats = SimulationStats(
        scenariosAttempted: 5,
        averageScore: 72.5,
      );

      final json = stats.toJson();

      expect(json['scenariosAttempted'], 5);
      expect(json['averageScore'], 72.5);
    });
  });
}
