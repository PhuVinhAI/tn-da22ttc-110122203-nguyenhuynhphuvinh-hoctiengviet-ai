import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';

class _TtsPlayingIdNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setId(String? id) => state = id;
}

/// ID of the message currently being spoken aloud. Null when silent.
final ttsPlayingMessageIdProvider =
    NotifierProvider<_TtsPlayingIdNotifier, String?>(
  _TtsPlayingIdNotifier.new,
);

final simulationTtsServiceProvider = Provider<SimulationTtsService>((ref) {
  final service = SimulationTtsService(ref);
  ref.onDispose(service.dispose);
  return service;
});

class SimulationTtsService {
  SimulationTtsService(this._ref);

  final Ref _ref;
  final FlutterTts _tts = FlutterTts();
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    await _tts.setLanguage('vi-VN');
    await _tts.setSpeechRate(0.45);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
    _tts.setCompletionHandler(_clearPlaying);
    _tts.setCancelHandler(_clearPlaying);
    _tts.setErrorHandler((_) => _clearPlaying());
    _initialized = true;
  }

  void _clearPlaying() {
    _ref.read(ttsPlayingMessageIdProvider.notifier).setId(null);
  }

  Future<void> speak(String messageId, String text) async {
    await _ensureInitialized();
    await _tts.stop();
    _ref.read(ttsPlayingMessageIdProvider.notifier).setId(messageId);
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
    _clearPlaying();
  }

  void dispose() {
    _tts.stop();
    _clearPlaying();
  }
}
