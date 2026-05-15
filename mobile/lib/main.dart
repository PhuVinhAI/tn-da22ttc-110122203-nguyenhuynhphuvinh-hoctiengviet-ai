import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/providers.dart';
import 'core/providers/theme_provider.dart';
import 'core/storage/preferences_service.dart';
import 'features/daily_goals/data/notification_service.dart';
import 'features/lessons/data/exercise_session_service.dart';
import 'features/lessons/data/lesson_providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env file not found, use dart-define or defaults
  }

  await Hive.initFlutter();
  // Exercise sessions store JSON-serialized maps (no TypeAdapter for MatchPair, etc.)
  final exerciseSessionBox =
      await Hive.openBox<Map<dynamic, dynamic>>('exercise_sessions');

  await GoogleSignIn.instance.initialize(
    serverClientId: dotenv.env['GOOGLE_CLIENT_ID'],
  );

  final prefs = await SharedPreferences.getInstance();
  final preferencesService = PreferencesService(prefs);

  tz_data.initializeTimeZones();
  await NotificationService.initialize();

  runApp(ProviderScope(
    overrides: [
      preferencesProvider.overrideWith(() => PreloadedPreferencesNotifier(preferencesService)),
      exerciseSessionServiceProvider.overrideWithValue(
        ExerciseSessionService(exerciseSessionBox),
      ),
    ],
    child: const LinVNixApp(),
  ));
}

class LinVNixApp extends ConsumerWidget {
  const LinVNixApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'LinVNix',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
