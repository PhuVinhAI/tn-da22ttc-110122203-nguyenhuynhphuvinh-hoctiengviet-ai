import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/exceptions/app_exception.dart';
import '../../../../core/providers/auth_state_provider.dart';
import '../../../../core/providers/providers.dart';
import '../../../../core/sync/sync.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/widgets/widgets.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../daily_goals/data/notification_service.dart';
import '../../../lessons/data/lesson_providers.dart';
import '../../../user/domain/user_profile.dart';
import '../../data/profile_providers.dart';

/// Dialog/action helpers extracted from SettingsScreen.
///
/// These own business logic (repository calls, cache clear, prefs reset,
/// navigation) wrapped in confirmation dialogs. Kept as top-level functions
/// (not a Notifier) because each is triggered once from a button tap and
/// drives a one-shot dialog flow — there is no observable state to expose.
/// Moving them out of settings_screen.dart keeps the screen file focused on
/// layout.

Future<void> startChangePassword(
  BuildContext context,
  WidgetRef ref,
  UserProfile profile,
) async {
  final confirmed = await AppDialog.show<bool>(
    context,
    builder: (ctx) => AppDialog(
      icon: Icons.lock_outline,
      title: S.of(context).changePasswordTitle,
      content: S.of(context).sendVerificationCodeContinueParam(profile.email),
      actions: [
        AppDialogAction(
          label: S.of(context).cancelButton2,
          onPressed: () => Navigator.pop(ctx, false),
        ),
        AppDialogAction(
          label: S.of(context).authContinueHome,
          isPrimary: true,
          onPressed: () => Navigator.pop(ctx, true),
        ),
      ],
    ),
  );

  if (confirmed != true || !context.mounted) return;

  try {
    final repository = ref.read(authRepositoryProvider);
    await repository.forgotPassword(email: profile.email);
    if (context.mounted) {
      context.push(
        '/reset-password-otp?email=${Uri.encodeComponent(profile.email)}&from=settings',
      );
    }
  } on AppException catch (e) {
    if (context.mounted) {
      AppToast.show(context, message: e.message, type: AppToastType.error);
    }
  } catch (_) {
    if (context.mounted) {
      AppToast.show(
        context,
        message: S.of(context).couldNotStartPasswordReset,
        type: AppToastType.error,
      );
    }
  }
}

void showClearDataDialog(BuildContext context, WidgetRef ref) {
  AppDialog.show(
    context,
    builder: (ctx) => AppDialog(
      icon: Icons.cleaning_services_outlined,
      iconColor: AppTheme.colors(ctx).error,
      title: S.of(context).clearDataTitle,
      content: S.of(context).clearDataWarningDesc,
      actions: [
        AppDialogAction(
          label: S.of(context).cancelButton2,
          onPressed: () => Navigator.pop(ctx),
        ),
        AppDialogAction(
          label: S.of(context).deleteData,
          isPrimary: true,
          isDestructive: true,
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              await ref.read(userRepositoryProvider).clearUserData();
              await ref.read(questionSessionServiceProvider).clearAll();

              try {
                final prefs = await ref.read(preferencesProvider.future);
                await prefs.clearOnboardingState();
                await prefs.clearLevelUpPromptFlags();
              } catch (_) {}

              try {
                await NotificationService.cancelDailyReminder();
              } catch (_) {}

              ref.read(onboardingCompletedProvider.notifier).reset();
              ref.read(dataChangeBusProvider.notifier).emit({
                'auth',
                'question',
                'progress',
                'bookmark',
                'daily-goal',
                'simulation',
                'simulation-results',
              });

              await ref.read(userProfileProvider.notifier).refresh();
              await ref.read(exerciseStatsProvider.notifier).refresh();

              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).allLearningDataDeleted,
                  type: AppToastType.success,
                );
                context.go('/onboarding');
              }
            } on AppException catch (e) {
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: e.message,
                  type: AppToastType.error,
                );
              }
            } catch (_) {
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).couldNotClearData,
                  type: AppToastType.error,
                );
              }
            }
          },
        ),
      ],
    ),
  );
}

void showDeleteAccountDialog(BuildContext context, WidgetRef ref) {
  AppDialog.show(
    context,
    builder: (ctx) => AppDialog(
      icon: Icons.delete_forever_outlined,
      iconColor: AppTheme.colors(ctx).error,
      title: S.of(context).deleteAccountTitle,
      content:
          '${S.of(context).deleteAccountWarningDesc1}${S.of(context).actionCannotBeUndone}',
      actions: [
        AppDialogAction(
          label: S.of(context).cancelButton2,
          onPressed: () => Navigator.pop(ctx),
        ),
        AppDialogAction(
          label: S.of(context).deleteAccountTitle,
          isPrimary: true,
          isDestructive: true,
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              await ref.read(userRepositoryProvider).deleteAccount();
              try {
                await ref.read(questionSessionServiceProvider).clearAll();
              } catch (_) {}
              try {
                final prefs = await ref.read(preferencesProvider.future);
                await prefs.clearOnboardingState();
                await prefs.clearLevelUpPromptFlags();
              } catch (_) {}
              try {
                await NotificationService.cancelDailyReminder();
              } catch (_) {}
              ref.read(onboardingCompletedProvider.notifier).reset();
              ref.read(dataChangeBusProvider.notifier).emit({
                'auth',
                'daily-goal',
                'bookmark',
                'question',
                'progress',
                'simulation',
                'simulation-results',
              });
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).accountDeletedSuccess,
                  type: AppToastType.success,
                );
                context.go('/login');
              }
            } on AppException catch (e) {
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: e.message,
                  type: AppToastType.error,
                );
              }
            } catch (_) {
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).couldNotDeleteAccount,
                  type: AppToastType.error,
                );
              }
            }
          },
        ),
      ],
    ),
  );
}

void showClearCacheDialog(BuildContext context, WidgetRef ref) {
  AppDialog.show(
    context,
    builder: (ctx) => AppDialog(
      icon: Icons.cached_outlined,
      title: S.of(context).clearCacheTitle,
      content: S.of(context).clearCacheWarningDesc,
      actions: [
        AppDialogAction(
          label: S.of(context).cancelButton2,
          onPressed: () => Navigator.pop(ctx),
        ),
        AppDialogAction(
          label: S.of(context).clearCacheTitle,
          isPrimary: true,
          isDestructive: true,
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              PaintingBinding.instance.imageCache
                ..clear()
                ..clearLiveImages();
              await DefaultCacheManager().emptyCache();

              ref.read(dataChangeBusProvider.notifier).emit({
                'auth',
                'question',
                'progress',
                'bookmark',
                'daily-goal',
                'simulation',
                'simulation-results',
              });

              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).clearCacheSuccess,
                  type: AppToastType.success,
                );
              }
            } catch (_) {
              if (context.mounted) {
                AppToast.show(
                  context,
                  message: S.of(context).couldNotClearCache,
                  type: AppToastType.error,
                );
              }
            }
          },
        ),
      ],
    ),
  );
}

void showLogoutDialog(BuildContext context, WidgetRef ref) {
  AppDialog.show(
    context,
    builder: (ctx) => AppDialog(
      icon: Icons.logout,
      title: S.of(context).logOutLabel,
      content: S.of(context).areYouSureLogOut,
      actions: [
        AppDialogAction(
          label: S.of(context).cancelButton2,
          onPressed: () => Navigator.pop(ctx),
        ),
        AppDialogAction(
          label: S.of(context).logOutLabel,
          isPrimary: true,
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              await ref.read(questionSessionServiceProvider).clearAll();
            } catch (_) {}
            await ref.read(authStateProvider.notifier).logout();
            if (ctx.mounted) {
              context.go('/login');
            }
          },
        ),
      ],
    ),
  );
}
