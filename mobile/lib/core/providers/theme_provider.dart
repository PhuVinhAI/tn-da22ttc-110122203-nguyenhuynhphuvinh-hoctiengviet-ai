import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';

final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    final prefsAsync = ref.watch(preferencesProvider);
    return prefsAsync.whenOrNull(data: (prefs) => prefs.themeMode) ??
        ThemeMode.system;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final prefs = await ref.read(preferencesProvider.future);
    await prefs.setThemeMode(mode);
  }
}
