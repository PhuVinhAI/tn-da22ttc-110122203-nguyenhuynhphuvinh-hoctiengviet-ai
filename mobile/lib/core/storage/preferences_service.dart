import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  PreferencesService(this._prefs);
  final SharedPreferences _prefs;

  static const _onboardingCompletedKey = 'onboarding_completed';
  static const _dailyGoalKey = 'daily_goal';
  static const _themeModeKey = 'theme_mode';

  bool get isOnboardingCompleted =>
      _prefs.getBool(_onboardingCompletedKey) ?? false;

  Future<void> setOnboardingCompleted() =>
      _prefs.setBool(_onboardingCompletedKey, true);

  Future<void> clearOnboardingState() async {
    await _prefs.remove(_onboardingCompletedKey);
    await _prefs.remove(_dailyGoalKey);
  }

  int get dailyGoal => _prefs.getInt(_dailyGoalKey) ?? 20;

  Future<void> setDailyGoal(int goal) =>
      _prefs.setInt(_dailyGoalKey, goal);

  ThemeMode get themeMode {
    final value = _prefs.getString(_themeModeKey);
    switch (value) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) {
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    return _prefs.setString(_themeModeKey, value);
  }
}
