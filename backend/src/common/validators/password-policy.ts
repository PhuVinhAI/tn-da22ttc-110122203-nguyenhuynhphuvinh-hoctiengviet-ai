/**
 * Single source of truth for the account password policy.
 *
 * Framework-agnostic so it can be reused by the class-validator constraint,
 * unit tests, and any future imperative checks. The mobile app mirrors these
 * exact rules in `password_policy.dart` — keep both sides in sync.
 */

export const PASSWORD_MIN_LENGTH = 12;

/**
 * Lowercased substrings that flag a password as weak/guessable. A password is
 * rejected if it *contains* any of these (e.g. "MyPassword2026!" is rejected
 * because it contains "password").
 */
export const WEAK_PASSWORD_SUBSTRINGS: readonly string[] = [
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

const RE_LOWERCASE = /[a-z]/;
const RE_UPPERCASE = /[A-Z]/;
const RE_NUMBER = /[0-9]/;
const RE_WHITESPACE = /\s/;
/** A "special character" is anything that is not a letter, number, or space. */
const RE_SPECIAL = /[^\p{L}\p{N}\s]/u;

export interface PasswordChecks {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
  noWhitespace: boolean;
  notCommon: boolean;
}

export function evaluatePassword(value: string): PasswordChecks {
  const v = value ?? '';
  const lower = v.toLowerCase();
  return {
    minLength: v.length >= PASSWORD_MIN_LENGTH,
    lowercase: RE_LOWERCASE.test(v),
    uppercase: RE_UPPERCASE.test(v),
    number: RE_NUMBER.test(v),
    special: RE_SPECIAL.test(v),
    noWhitespace: v.length > 0 && !RE_WHITESPACE.test(v),
    notCommon:
      v.length > 0 && !WEAK_PASSWORD_SUBSTRINGS.some((w) => lower.includes(w)),
  };
}

export function isPasswordStrong(value: string): boolean {
  const c = evaluatePassword(value);
  return (
    c.minLength &&
    c.lowercase &&
    c.uppercase &&
    c.number &&
    c.special &&
    c.noWhitespace &&
    c.notCommon
  );
}

/** Human-readable message listing exactly which rules the value failed. */
export function describePasswordFailure(value: string): string {
  const c = evaluatePassword(value);
  const missing: string[] = [];
  if (!c.minLength) missing.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (!c.lowercase) missing.push('a lowercase letter');
  if (!c.uppercase) missing.push('an uppercase letter');
  if (!c.number) missing.push('a number');
  if (!c.special) missing.push('a special character');
  if (!c.noWhitespace) missing.push('no spaces');
  if (!c.notCommon) missing.push('not be a common/guessable password');
  if (missing.length === 0) {
    return 'Password does not meet the security requirements';
  }
  return `Password is too weak. It must contain: ${missing.join(', ')}.`;
}
