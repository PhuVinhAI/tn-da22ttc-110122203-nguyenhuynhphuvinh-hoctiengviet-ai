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
  '/camera',
  '/',
  '/courses',
  '/profile',
  '/practice',
  '/settings',
};

/// Pure visibility check used by `GlobalAssistantShell` and unit-tested in
/// isolation. The shell hides the bar on one-time flows, bottom-nav tabs,
/// practice surfaces (tab + character pick + live conversation), where a
/// persistent compose/input must sit flush above the keyboard.
bool isAssistantBarVisible(String? location) {
  if (location == null || location.isEmpty) return false;
  // Strip the query string so e.g. `/verify-email?email=...` still matches.
  final pathOnly = location.split('?').first;
  if (pathOnly.endsWith('/select-character')) return false;
  if (pathOnly.startsWith('/practice/sessions/')) return false;
  return !_hiddenLocations.contains(pathOnly);
}
