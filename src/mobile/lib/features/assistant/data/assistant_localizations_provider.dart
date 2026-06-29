import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/locale_provider.dart';
import '../../../l10n/app_localizations.dart';

/// Resolves the current `S` (generated `AppLocalizations`) instance for use
/// outside of widget tree (e.g. inside `ScreenContextBuilder`s, which only
/// receive a `Ref` and have no `BuildContext`).
///
/// Falls back to Vietnamese when no locale has been set yet — this is the
/// template locale and matches the platform default for first launches
/// before the user-pref store has hydrated.
final assistantLocalizationsProvider = Provider<S>((ref) {
  final locale = ref.watch(localeProvider) ?? const Locale('vi');
  return lookupS(locale);
});
