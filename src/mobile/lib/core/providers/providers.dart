import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../storage/secure_storage_service.dart';
import '../storage/preferences_service.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/user/data/user_repository.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService(const FlutterSecureStorage());
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(secureStorageProvider));
});

final dioProvider = Provider((ref) => ref.watch(apiClientProvider).dio);

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ref.watch(dioProvider));
});

class PreferencesNotifier extends AsyncNotifier<PreferencesService> {
  @override
  Future<PreferencesService> build() async {
    final prefs = await SharedPreferences.getInstance();
    return PreferencesService(prefs);
  }
}

class PreloadedPreferencesNotifier extends PreferencesNotifier {
  PreloadedPreferencesNotifier(this._value);
  final PreferencesService _value;

  @override
  Future<PreferencesService> build() async => _value;
}

final preferencesProvider = AsyncNotifierProvider<PreferencesNotifier, PreferencesService>(
  PreferencesNotifier.new,
);

final onboardingCompletedProvider = NotifierProvider<OnboardingCompletedNotifier, bool>(
  OnboardingCompletedNotifier.new,
);

class OnboardingCompletedNotifier extends Notifier<bool> {
  bool _markedCompleted = false;

  @override
  bool build() {
    final prefsAsync = ref.watch(preferencesProvider);
    final fromPrefs = prefsAsync.whenOrNull(
      data: (prefs) => prefs.isOnboardingCompleted,
    );
    if (fromPrefs == true) {
      _markedCompleted = false;
      return true;
    }
    if (fromPrefs == false) {
      _markedCompleted = false;
      return false;
    }
    // While prefs reload, keep optimistic completion from markCompleted().
    return _markedCompleted;
  }

  void markCompleted() {
    _markedCompleted = true;
    state = true;
  }

  void reset() {
    _markedCompleted = false;
    state = false;
  }
}
