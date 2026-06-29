import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(LocaleNotifier.new);

class LocaleNotifier extends Notifier<Locale?> {
  @override
  Locale? build() {
    final prefsAsync = ref.watch(preferencesProvider);
    return prefsAsync.whenOrNull(
      data: (prefs) => Locale(prefs.locale ?? 'en'),
    );
  }

  Future<void> setLocale(Locale? locale) async {
    state = locale;
    final prefs = await ref.read(preferencesProvider.future);
    await prefs.setLocale(locale?.languageCode);
  }
}
