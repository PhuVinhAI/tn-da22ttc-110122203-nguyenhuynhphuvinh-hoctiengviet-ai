import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../sync/sync.dart';
import 'providers.dart';

class AuthState {
  const AuthState({
    this.isAuthenticated = false,
    this.isInitialized = false,
  });

  final bool isAuthenticated;
  final bool isInitialized;

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isInitialized,
  }) =>
      AuthState(
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        isInitialized: isInitialized ?? this.isInitialized,
      );
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    final apiClient = ref.read(apiClientProvider);
    apiClient.onAuthFailure = () => setAuthenticated(false);
    _checkAuth();
    return const AuthState();
  }

  Future<void> _checkAuth() async {
    final storage = ref.read(secureStorageProvider);
    final hasTokens = await storage.hasToken;
    if (!hasTokens) {
      state = state.copyWith(isInitialized: true, isAuthenticated: false);
      return;
    }

    try {
      final refreshToken = await storage.getRefreshToken();
      if (refreshToken == null) {
        state = state.copyWith(isInitialized: true, isAuthenticated: false);
        return;
      }

      final repository = ref.read(authRepositoryProvider);
      final tokenResponse = await repository.refreshToken(
        refreshToken: refreshToken,
      );
      await storage.saveTokens(
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
      );
      state = state.copyWith(isInitialized: true, isAuthenticated: true);
    } catch (_) {
      await storage.clearTokens();
      state = state.copyWith(isInitialized: true, isAuthenticated: false);
    }
  }

  void setAuthenticated(bool value) {
    state = state.copyWith(isAuthenticated: value);
  }

  void notifyAuthenticated(bool authenticated) {
    state = state.copyWith(isAuthenticated: authenticated);
    if (authenticated) {
      ref.read(dataChangeBusProvider.notifier).emit({'auth'});
    }
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    final refreshToken = await storage.getRefreshToken();

    if (refreshToken != null) {
      try {
        final repository = ref.read(authRepositoryProvider);
        await repository.logout(refreshToken: refreshToken);
      } catch (_) {}
    }

    await storage.clearTokens();

    try {
      final prefs = await ref.read(preferencesProvider.future);
      await prefs.clearOnboardingState();
    } catch (_) {}

    ref.read(onboardingCompletedProvider.notifier).reset();
    ref.read(dataChangeBusProvider.notifier).emit({'auth'});

    state = state.copyWith(isAuthenticated: false);
  }
}

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
