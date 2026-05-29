/// Account password policy — single source of truth for the mobile client.
///
/// Mirrors the backend rules in `backend/src/common/validators/password-policy.ts`.
/// Keep both sides in sync: ≥12 chars, with uppercase, lowercase, a number and
/// a special character, no whitespace, and not a common/guessable password.
library;

enum PasswordStrength { none, weak, medium, strong }

/// Outcome of evaluating a password against each individual rule.
class PasswordChecks {
  const PasswordChecks({
    required this.minLength,
    required this.lowercase,
    required this.uppercase,
    required this.number,
    required this.special,
    required this.noSpace,
    required this.notCommon,
  });

  final bool minLength;
  final bool lowercase;
  final bool uppercase;
  final bool number;
  final bool special;
  final bool noSpace;
  final bool notCommon;

  bool get allSatisfied =>
      minLength &&
      lowercase &&
      uppercase &&
      number &&
      special &&
      noSpace &&
      notCommon;
}

class PasswordPolicy {
  PasswordPolicy._();

  static const int minLength = 12;

  /// Lowercased substrings that mark a password as weak/guessable. A password
  /// is rejected if it *contains* any of these. Mirrors the backend list.
  static const List<String> weakSubstrings = [
    'password',
    'passw0rd',
    'matkhau',
    'qwerty',
    'azerty',
    'iloveyou',
    'letmein',
    'welcome',
    'admin',
    'monkey',
    'dragon',
    'football',
    'abc123',
    '123456',
    '12345678',
    '123456789',
    '1234567890',
    '111111',
    '000000',
  ];

  static final RegExp _lower = RegExp(r'[a-z]');
  static final RegExp _upper = RegExp(r'[A-Z]');
  static final RegExp _number = RegExp(r'[0-9]');
  static final RegExp _whitespace = RegExp(r'\s');

  /// A "special character" is anything that is not a letter, number, or space.
  static final RegExp _special = RegExp(r'[^\p{L}\p{N}\s]', unicode: true);

  static PasswordChecks evaluate(String value) {
    final lower = value.toLowerCase();
    return PasswordChecks(
      minLength: value.length >= minLength,
      lowercase: _lower.hasMatch(value),
      uppercase: _upper.hasMatch(value),
      number: _number.hasMatch(value),
      special: _special.hasMatch(value),
      noSpace: value.isNotEmpty && !_whitespace.hasMatch(value),
      notCommon:
          value.isNotEmpty && !weakSubstrings.any((w) => lower.contains(w)),
    );
  }

  static bool isStrong(String value) => evaluate(value).allSatisfied;

  /// Coarse strength used to drive the progress bar: weak / medium / strong.
  static PasswordStrength strength(String value) {
    if (value.isEmpty) return PasswordStrength.none;

    final c = evaluate(value);
    if (!c.notCommon) return PasswordStrength.weak;
    if (c.allSatisfied) return PasswordStrength.strong;

    var score = 0;
    if (value.length >= 8) score++;
    if (value.length >= minLength) score++;
    if (c.lowercase) score++;
    if (c.uppercase) score++;
    if (c.number) score++;
    if (c.special) score++;

    return score <= 3 ? PasswordStrength.weak : PasswordStrength.medium;
  }
}
