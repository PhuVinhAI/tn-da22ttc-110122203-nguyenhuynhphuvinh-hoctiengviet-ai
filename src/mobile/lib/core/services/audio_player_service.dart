import 'package:just_audio/just_audio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final audioPlayerProvider = Provider<AudioPlayerService>((ref) {
  return AudioPlayerService();
});

class AudioPlayerService {
  AudioPlayerService() : _player = AudioPlayer();

  final AudioPlayer _player;
  String? _currentUrl;

  Future<void> play(String url) async {
    if (_currentUrl == url && _player.playing) {
      await _player.stop();
      return;
    }

    _currentUrl = url;
    await _player.setUrl(url);
    await _player.play();
  }

  Future<void> stop() async {
    await _player.stop();
    _currentUrl = null;
  }

  void dispose() {
    _player.dispose();
  }
}
