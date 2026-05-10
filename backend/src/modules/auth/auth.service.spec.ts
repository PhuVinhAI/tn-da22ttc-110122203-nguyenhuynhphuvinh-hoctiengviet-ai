import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/application/users.service';
import { LoggingService } from '../../infrastructure/logging/logging.service';
import { EmailQueueService } from '../../infrastructure/queue/email-queue.service';
import { TokenLifecycle } from './token-lifecycle/token-lifecycle.service';
import { RefreshToken } from './domain/refresh-token.entity';
import { Role } from './domain/role.entity';

jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
    __mockVerifyIdToken: verifyIdToken,
  };
});

const { __mockVerifyIdToken: mockVerifyIdToken } = jest.requireMock(
  'google-auth-library',
);

function createMockTicket(payload: Record<string, any>) {
  return {
    getPayload: () => payload,
  };
}

describe('AuthService.loginWithGoogleToken', () => {
  let service: AuthService;

  const mockUsersService = {
    findByGoogleId: jest.fn(),
    findByEmail: jest.fn(),
    createOAuthUser: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.accessTokenExpiresIn') return '15m';
      if (key === 'jwt.refreshTokenExpiresIn') return '7d';
      return undefined;
    }),
  };

  const mockLoggingService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockEmailQueueService = {
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordChangedEmail: jest.fn(),
  };

  const mockTokenLifecycle = {
    createVerificationToken: jest.fn(),
    verifyEmailToken: jest.fn(),
    verifyEmailCode: jest.fn(),
    createPasswordResetToken: jest.fn(),
    verifyPasswordResetToken: jest.fn(),
    cleanupExpired: jest.fn(),
  };

  const mockRefreshTokenRepo = {
    create: jest.fn().mockImplementation((data) => data),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'rt-id' }),
      ),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'role-id', name: 'USER' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: TokenLifecycle, useValue: mockTokenLifecycle },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns user + access_token + refresh_token for valid Google ID token', async () => {
    const googlePayload = {
      sub: 'google-123',
      email: 'test@gmail.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce(createMockTicket(googlePayload));

    const existingUser = {
      id: 'user-1',
      email: 'test@gmail.com',
      fullName: 'Test User',
      googleId: 'google-123',
      onboardingCompleted: false,
    };
    mockUsersService.findByGoogleId.mockResolvedValueOnce(existingUser);

    const result = await service.loginWithGoogleToken('valid-id-token');

    expect(result).toEqual({
      user: existingUser,
      access_token: 'mock-access-token',
      refresh_token: expect.any(String),
      expires_in: 900,
    });
  });

  it('throws UnauthorizedException for invalid Google ID token', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    await expect(
      service.loginWithGoogleToken('invalid-id-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('creates new user when Google user does not exist', async () => {
    const googlePayload = {
      sub: 'google-new',
      email: 'new@gmail.com',
      name: 'New User',
      picture: 'https://example.com/avatar.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce(createMockTicket(googlePayload));
    mockUsersService.findByGoogleId.mockResolvedValueOnce(null);
    mockUsersService.findByEmail.mockResolvedValueOnce(null);

    const newUser = {
      id: 'user-new',
      email: 'new@gmail.com',
      fullName: 'New User',
      googleId: 'google-new',
      onboardingCompleted: false,
    };
    mockUsersService.createOAuthUser.mockResolvedValueOnce(newUser);
    mockUsersService.save.mockResolvedValueOnce(newUser);

    const result = await service.loginWithGoogleToken('valid-id-token');

    expect(mockUsersService.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@gmail.com',
        fullName: 'New User',
        googleId: 'google-new',
        provider: 'google',
      }),
    );
    expect(result.user).toEqual(newUser);
    expect(result.access_token).toBeDefined();
    expect(result.refresh_token).toBeDefined();
  });

  it('links Google account to existing email-only user', async () => {
    const googlePayload = {
      sub: 'google-link',
      email: 'existing@gmail.com',
      name: 'Existing User',
      picture: 'https://example.com/avatar.jpg',
    };

    mockVerifyIdToken.mockResolvedValueOnce(createMockTicket(googlePayload));
    mockUsersService.findByGoogleId.mockResolvedValueOnce(null);

    const existingEmailUser = {
      id: 'user-existing',
      email: 'existing@gmail.com',
      fullName: 'Existing User',
      googleId: null,
      onboardingCompleted: true,
    };
    mockUsersService.findByEmail.mockResolvedValueOnce(existingEmailUser);

    const result = await service.loginWithGoogleToken('valid-id-token');

    expect(mockUsersService.update).toHaveBeenCalledWith(
      'user-existing',
      expect.objectContaining({
        googleId: 'google-link',
        provider: 'google',
        emailVerified: true,
      }),
    );
    expect(result.user).toEqual(existingEmailUser);
  });
});
