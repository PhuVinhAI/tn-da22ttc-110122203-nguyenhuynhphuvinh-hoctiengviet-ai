import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m', // Short-lived
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Long-lived
  // Legacy support
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
}));
