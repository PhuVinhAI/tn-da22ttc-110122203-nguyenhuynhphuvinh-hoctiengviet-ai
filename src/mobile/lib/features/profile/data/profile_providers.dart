import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync.dart';
import '../../../core/providers/providers.dart';
import '../../user/domain/user_profile.dart';
import '../domain/exercise_stats.dart';

class UserProfileNotifier extends AsyncNotifier<UserProfile>
    with CachedNotifierMixin<UserProfile>, DataChangeBusSubscriber<UserProfile> {
  @override
  Future<UserProfile> build() async {
    watchTags({'auth'});
    final repository = ref.read(userRepositoryProvider);
    final data = await repository.getMe();
    return UserProfile.fromJson(data);
  }

  Future<void> updateProfile({
    String? fullName,
    String? nativeLanguage,
    String? currentLevel,
    String? preferredDialect,
    String? avatarUrl,
    bool? notificationEnabled,
    String? notificationTime,
  }) async {
    final repository = ref.read(userRepositoryProvider);
    final data = <String, dynamic>{};
    if (fullName != null) data['fullName'] = fullName;
    if (nativeLanguage != null) data['nativeLanguage'] = nativeLanguage;
    if (currentLevel != null) data['currentLevel'] = currentLevel;
    if (preferredDialect != null) data['preferredDialect'] = preferredDialect;
    if (avatarUrl != null) data['avatarUrl'] = avatarUrl;
    if (notificationEnabled != null) data['notificationEnabled'] = notificationEnabled;
    if (notificationTime != null) data['notificationTime'] = notificationTime;

    final updated = await repository.updateMe(data);
    state = AsyncData(UserProfile.fromJson(updated));
  }
}

final userProfileProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfile>(
  UserProfileNotifier.new,
);

class ExerciseStatsNotifier extends AsyncNotifier<ExerciseStats>
    with CachedNotifierMixin<ExerciseStats>, DataChangeBusSubscriber<ExerciseStats> {
  @override
  Future<ExerciseStats> build() async {
    watchTags({'question'});
    final repository = ref.read(userRepositoryProvider);
    final data = await repository.getMyStats();
    return ExerciseStats.fromJson(data);
  }
}

final exerciseStatsProvider =
    AsyncNotifierProvider<ExerciseStatsNotifier, ExerciseStats>(
  ExerciseStatsNotifier.new,
);
