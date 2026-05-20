import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../bookmarks/data/bookmark_providers.dart';
import '../../../bookmarks/domain/bookmark_models.dart';
import '../../../profile/data/profile_providers.dart';
import '../../../profile/domain/exercise_stats.dart';
import '../../../user/domain/user_profile.dart';
import '../../domain/screen_context.dart';
import '../route_match.dart';
import 'course_context_summaries.dart';

/// `ScreenContext` builder for `/profile`. Pulls the learner profile,
/// exercise stats, and bookmark stats so the AI can answer account and
/// progress questions without tool calls.
ScreenContext profileScreenContextBuilder(Ref ref, RouteMatch match) {
  final profileAsync = ref.watch(userProfileProvider);
  final exerciseStatsAsync = ref.watch(exerciseStatsProvider);
  final bookmarkStatsAsync = ref.watch(bookmarkStatsProvider);
  final status = _profileStatus(
    profileAsync,
    exerciseStatsAsync,
    bookmarkStatsAsync,
  );

  final data = <String, dynamic>{
    'screenType': 'profile',
    'status': status,
  };

  if (status == 'error') {
    data['error'] = shortAsyncError(
      profileAsync.hasError
          ? profileAsync.error
          : exerciseStatsAsync.hasError
              ? exerciseStatsAsync.error
              : bookmarkStatsAsync.error,
    );
  } else if (status == 'data') {
    data['profile'] = _profileSummary(profileAsync.requireValue);
    data['exerciseStats'] = exerciseStatsAsync.requireValue.toJson();
    final bookmarkStats = bookmarkStatsAsync.requireValue;
    data['bookmarkStats'] = {
      'total': bookmarkStats.total,
      'byPartOfSpeech': bookmarkStats.byPartOfSpeech,
    };
  }

  final fullName =
      profileAsync.whenOrNull(data: (profile) => profile.fullName);

  return ScreenContext(
    route: match.location,
    displayName: fullName != null ? 'Profile · $fullName' : 'Profile',
    barPlaceholder: 'Ask about your account?',
    data: data,
  );
}

String _profileStatus(
  AsyncValue<UserProfile> profileAsync,
  AsyncValue<ExerciseStats> exerciseStatsAsync,
  AsyncValue<BookmarkStats> bookmarkStatsAsync,
) {
  if (profileAsync.hasError ||
      exerciseStatsAsync.hasError ||
      bookmarkStatsAsync.hasError) {
    return 'error';
  }
  if (profileAsync.isLoading ||
      exerciseStatsAsync.isLoading ||
      bookmarkStatsAsync.isLoading) {
    return 'loading';
  }
  return 'data';
}

Map<String, dynamic> _profileSummary(UserProfile profile) {
  return {
    'fullName': profile.fullName,
    if (profile.nativeLanguage != null)
      'nativeLanguage': profile.nativeLanguage,
    if (profile.currentLevel != null) 'currentLevel': profile.currentLevel,
    if (profile.preferredDialect != null)
      'preferredDialect': profile.preferredDialect,
    'onboardingCompleted': profile.onboardingCompleted,
    'notificationEnabled': profile.notificationEnabled,
    'notificationTime': profile.notificationTime,
  };
}
