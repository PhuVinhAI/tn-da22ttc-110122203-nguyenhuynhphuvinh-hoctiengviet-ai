/// Locations where the AssistantBar must be hidden. Includes one-time linear
/// flows (auth + onboarding + splash) and the three shell tabs that already
/// expose a bottom navigation bar.
const Set<String> _hiddenLocations = {
  '/splash',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/reset-password-otp',
  '/onboarding',
  '/',
  '/courses',
  '/profile',
};

/// Pure visibility check used by `GlobalAssistantShell` and unit-tested in
/// isolation. The bar is hidden until the router has emitted a location
/// (initial null), on the flows above, and on the three bottom-nav tabs;
/// visible everywhere else, including all nested exercise-play routes.
bool isAssistantBarVisible(String? location) {
  if (location == null || location.isEmpty) return false;
  // Strip the query string so e.g. `/verify-email?email=...` still matches.
  final pathOnly = location.split('?').first;
  return !_hiddenLocations.contains(pathOnly);
}
