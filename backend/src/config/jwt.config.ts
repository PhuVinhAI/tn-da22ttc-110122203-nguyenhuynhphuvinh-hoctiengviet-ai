import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  // env.validation.ts enforces JWT_SECRET presence at bootstrap, but guard
  // here too (defense-in-depth) so a misconfigured runtime can never sign or
  // verify tokens with an empty/public secret.
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is required — set it in your environment before starting the app',
    );
  }

  return {
    secret,
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m', // Short-lived
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Long-lived
    // Legacy support
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
});
