import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  NotificationService._();

  static final _plugin = FlutterLocalNotificationsPlugin();
  static const _channelId = 'daily_goal_reminders';
  static const _channelName = 'Daily goal reminders';
  static const _channelDescription = 'Reminders for your daily learning goals';
  static const _notificationId = 0;

  static Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    await _plugin.initialize(settings: settings);
  }

  static Future<bool> requestPermissions() async {
    if (defaultTargetPlatform == TargetPlatform.android) {
      final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        final alreadyEnabled =
            await androidPlugin.areNotificationsEnabled() ?? false;
        if (alreadyEnabled) return true;
        final granted = await androidPlugin.requestNotificationsPermission();
        return granted ?? false;
      }
    }

    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final iosPlugin = _plugin.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();
      if (iosPlugin != null) {
        final result = await iosPlugin.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
        return result ?? false;
      }
    }

    return true;
  }

  static Future<void> scheduleDailyReminder({
    required String notificationTime,
    required String title,
    required String body,
  }) async {
    await cancelDailyReminder();

    final parts = notificationTime.split(':');
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);

    final location = tz.getLocation('Asia/Ho_Chi_Minh');
    final now = tz.TZDateTime.now(location);
    var scheduled = tz.TZDateTime(
      location,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    await _plugin.zonedSchedule(
      id: _notificationId,
      title: title,
      body: body,
      scheduledDate: scheduled,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDescription,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
  }

  static Future<void> cancelDailyReminder() async {
    await _plugin.cancel(id: _notificationId);
  }
}
