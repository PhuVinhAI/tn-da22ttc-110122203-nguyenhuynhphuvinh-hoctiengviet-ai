/// Locations where the AssistantBar must be hidden. Per PRD, these are the
/// one-time linear flows (auth + onboarding + splash) where the assistant
/// would be a distraction.
const Set<String> _hiddenLocations = {
  '/splash',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/reset-password-otp',
  '/onboarding',
};

/// Pure visibility check used by `GlobalAssistantShell` and unit-tested in
/// isolation. The bar is hidden until the router has emitted a location
/// (initial null) and on the eight one-time linear flows above; visible
/// everywhere else, including all the nested exercise-play routes.
bool isAssistantBarVisible(String? location) {
  if (location == null || location.isEmpty) return false;
  // Strip the query string so e.g. `/verify-email?email=...` still matches.
  final pathOnly = location.split('?').first;
  return !_hiddenLocations.contains(pathOnly);
}
