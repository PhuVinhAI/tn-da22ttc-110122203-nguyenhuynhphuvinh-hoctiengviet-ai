import 'dart:async';

import 'package:speech_to_text/speech_to_text.dart' as stt;

class AppSpeechRecognizer {
  AppSpeechRecognizer._();
  static final instance = AppSpeechRecognizer._();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final _statusController = StreamController<String>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  bool _initialized = false;
  bool _available = false;
  String? _vietnameseLocaleId;

  Stream<String> get statuses => _statusController.stream;
  Stream<String> get errors => _errorController.stream;
  bool get isListening => _speech.isListening;

  Future<bool> ensureReady() async {
    if (_initialized) return _available;

    _available = await _speech.initialize(
      onStatus: _statusController.add,
      onError: (error) => _errorController.add(error.errorMsg),
      options: [stt.SpeechToText.androidNoBluetooth],
    );
    _initialized = true;

    if (_available) {
      _vietnameseLocaleId = await _resolveVietnameseLocale();
    }

    return _available;
  }

  Future<String?> _resolveVietnameseLocale() async {
    final locales = await _speech.locales();
    for (final locale in locales) {
      final id = locale.localeId.toLowerCase().replaceAll('_', '-');
      if (id.startsWith('vi')) return locale.localeId;
    }
    return null;
  }

  Future<void> listen({required stt.SpeechResultListener onResult}) async {
    final ready = await ensureReady();
    if (!ready) return;

    await _speech.listen(
      onResult: onResult,
      listenOptions: stt.SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
        pauseFor: const Duration(seconds: 3),
        listenFor: const Duration(seconds: 12),
        localeId: _vietnameseLocaleId,
      ),
    );
  }

  Future<void> stop() => _speech.stop();
  Future<void> cancel() => _speech.cancel();
}
