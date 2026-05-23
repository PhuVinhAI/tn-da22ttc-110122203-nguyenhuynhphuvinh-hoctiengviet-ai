import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  PreferencesService(this._prefs);
  final SharedPreferences _prefs;

  static const _onboardingCompletedKey = 'onboarding_completed';
  static const _dailyGoalsMigratedKey = 'daily_goals_migrated';
  static const _themeModeKey = 'theme_mode';
  static const _notificationEnabledKey = 'notification_enabled';
  static const _notificationTimeKey = 'notification_time';
  static const _assistantBarEnabledKey = 'assistant_bar_enabled';

  bool get isOnboardingCompleted =>
      _prefs.getBool(_onboardingCompletedKey) ?? false;

  Future<void> setOnboardingCompleted() =>
      _prefs.setBool(_onboardingCompletedKey, true);

  Future<void> clearOnboardingState() async {
    await _prefs.remove(_onboardingCompletedKey);
    await _prefs.remove(_dailyGoalsMigratedKey);
  }

  bool get isDailyGoalsMigrated =>
      _prefs.getBool(_dailyGoalsMigratedKey) ?? false;

  Future<void> setDailyGoalsMigrated() =>
      _prefs.setBool(_dailyGoalsMigratedKey, true);

  bool get notificationEnabled =>
      _prefs.getBool(_notificationEnabledKey) ?? false;

  Future<void> setNotificationEnabled(bool enabled) =>
      _prefs.setBool(_notificationEnabledKey, enabled);

  String get notificationTime =>
      _prefs.getString(_notificationTimeKey) ?? '20:00';

  Future<void> setNotificationTime(String time) =>
      _prefs.setString(_notificationTimeKey, time);

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

  bool get assistantBarEnabled =>
      _prefs.getBool(_assistantBarEnabledKey) ?? true;

  Future<void> setAssistantBarEnabled(bool enabled) =>
      _prefs.setBool(_assistantBarEnabledKey, enabled);

  bool isLevelUpPrompted(String courseId) =>
      _prefs.getBool('level_up_prompted_$courseId') ?? false;

  Future<void> setLevelUpPrompted(String courseId, bool value) =>
      _prefs.setBool('level_up_prompted_$courseId', value);

  Future<void> clearLevelUpPromptFlags() async {
    final keys = _prefs
        .getKeys()
        .where((k) => k.startsWith('level_up_prompted_'))
        .toList();
    for (final key in keys) {
      await _prefs.remove(key);
    }
  }
}
