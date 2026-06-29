import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
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
import 'core/providers/locale_provider.dart';
import 'core/storage/preferences_service.dart';
import 'features/assistant/presentation/global_assistant_shell.dart';
import 'features/daily_goals/data/notification_service.dart';
import 'features/lessons/data/question_session_service.dart';
import 'features/lessons/data/lesson_providers.dart';
import 'l10n/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env file not found, use dart-define or defaults
  }

  await Hive.initFlutter();
  // Question sessions store JSON-serialized maps (no TypeAdapter for MatchPair, etc.)
  final questionSessionBox =
      await Hive.openBox<Map<dynamic, dynamic>>('question_sessions');

  // GOOGLE_CLIENT_ID: --dart-define wins, .env fallback
  const dartDefineClientId = String.fromEnvironment('GOOGLE_CLIENT_ID');
  final googleClientId = dartDefineClientId.isNotEmpty
      ? dartDefineClientId
      : dotenv.env['GOOGLE_CLIENT_ID'];
  await GoogleSignIn.instance.initialize(serverClientId: googleClientId);

  final prefs = await SharedPreferences.getInstance();
  final preferencesService = PreferencesService(prefs);

  tz_data.initializeTimeZones();
  await NotificationService.initialize();

  runApp(ProviderScope(
    overrides: [
      preferencesProvider.overrideWith(() => PreloadedPreferencesNotifier(preferencesService)),
      questionSessionServiceProvider.overrideWithValue(
        QuestionSessionService(questionSessionBox),
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
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      onGenerateTitle: (context) => S.of(context).appName,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      locale: locale,
      localizationsDelegates: const [
        S.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: S.supportedLocales,
      routerConfig: router,
      builder: (context, child) =>
          GlobalAssistantShell(child: child ?? const SizedBox.shrink()),
    );
  }
}
