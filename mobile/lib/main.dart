import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/providers/providers.dart';
import 'core/providers/theme_provider.dart';
import 'core/storage/preferences_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env file not found, use dart-define or defaults
  }

  await GoogleSignIn.instance.initialize(
    serverClientId: dotenv.env['GOOGLE_CLIENT_ID'],
  );

  final prefs = await SharedPreferences.getInstance();
  final preferencesService = PreferencesService(prefs);

  runApp(ProviderScope(
    overrides: [
      preferencesProvider.overrideWithValue(AsyncData(preferencesService)),
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
