import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'Tạo tài khoản người dùng mới với email, password và thông tin cá nhân. Email xác thực sẽ được gửi tự động.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        message:
          'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã xác thực.',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập bằng email và password để nhận JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'user@example.com',
          fullName: 'John Doe',
          currentLevel: 'A1',
          emailVerified: true,
          roles: [{ name: 'USER', permissions: [] }],
        },
        access_token: 'jwt-access-token',
        refresh_token: 'refresh-token-string',
        expires_in: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Email hoặc password không đúng' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary: 'Xác thực email',
    description: 'Xác thực email bằng token nhận được từ email',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      example: {
        message: 'Email đã được xác thực thành công!',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('verify-email-code')
  @ApiOperation({
    summary: 'Xác thực email bằng mã OTP',
    description:
      'Xác thực email bằng mã 6 chữ số nhận được từ email. Trả về JWT tokens sau khi xác thực thành công.',
  })
  @ApiBody({ type: VerifyEmailCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      example: {
        user: { id: 'uuid', email: 'user@example.com', fullName: 'John Doe' },
        access_token: 'jwt-access-token',
        refresh_token: 'refresh-token-string',
        expires_in: 900,
        message: 'Email đã được xác thực thành công!',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã xác thực không hợp lệ hoặc đã hết hạn',
  })
  async verifyEmailCode(
    @Body() verifyEmailCodeDto: VerifyEmailCodeDto,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.verifyEmailCode(
      verifyEmailCodeDto.email,
      verifyEmailCodeDto.code,
      userAgent,
      ipAddress,
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu',
    description: 'Gửi email chứa mã OTP đặt lại mật khẩu',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email đã được gửi',
    schema: {
      example: {
        message: 'Nếu email tồn tại, bạn sẽ nhận được mã đặt lại mật khẩu.',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('verify-reset-code')
  @ApiOperation({
    summary: 'Xác thực mã OTP đặt lại mật khẩu',
    description:
      'Xác thực mã OTP 6 chữ số từ email quên mật khẩu. Trả về reset token để đặt lại mật khẩu.',
  })
  @ApiBody({ type: VerifyResetCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Mã OTP hợp lệ',
    schema: {
      example: {
        reset_token: 'hex-token-string',
        message: 'Mã xác thực hợp lệ. Vui lòng đặt lại mật khẩu.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(
      verifyResetCodeDto.email,
      verifyResetCodeDto.code,
    );
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu mới bằng token từ email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    schema: {
      example: {
        message: 'Mật khẩu đã được đặt lại thành công!',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({
    summary: 'Gửi lại email xác thực',
    description: 'Gửi lại email xác thực cho user chưa verify',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email đã được gửi lại',
    schema: {
      example: {
        message: 'Email xác thực đã được gửi lại!',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email đã được xác thực' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Đăng nhập bằng Google',
    description: 'Redirect đến trang đăng nhập Google OAuth',
  })
  @ApiResponse({ status: 302, description: 'Redirect đến Google' })
  async googleAuth() {
    // Guard sẽ redirect đến Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Xử lý callback từ Google sau khi đăng nhập thành công',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'user@gmail.com',
          fullName: 'John Doe',
          googleId: 'google-user-id',
          provider: 'google',
          emailVerified: true,
        },
        access_token: 'jwt-token-string',
      },
    },
  })
  googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = this.authService.loginWithGoogle(req.user);

    // Redirect về frontend với token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('google/token')
  @ApiOperation({
    summary: 'Đăng nhập bằng Google ID token',
    description:
      'Xác thực Google ID token từ client-side (mobile/SPA), trả về JWT access + refresh tokens.',
  })
  @ApiBody({ type: GoogleTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'user@gmail.com',
          fullName: 'John Doe',
          googleId: 'google-user-id',
          provider: 'google',
          emailVerified: true,
        },
        access_token: 'jwt-access-token',
        refresh_token: 'refresh-token-string',
        expires_in: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Google ID token không hợp lệ' })
  async googleTokenAuth(
    @Body() googleTokenDto: GoogleTokenDto,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.loginWithGoogleToken(
      googleTokenDto.idToken,
      userAgent,
      ipAddress,
    );
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Làm mới access token',
    description:
      'Sử dụng refresh token để lấy access token mới. Refresh token cũ sẽ bị thu hồi (token rotation).',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token đã được làm mới',
    schema: {
      example: {
        access_token: 'new-jwt-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 900,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.refreshAccessToken(
      refreshTokenDto,
      userAgent,
      ipAddress,
    );
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Thu hồi refresh token và đăng xuất khỏi hệ thống',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    schema: {
      example: {
        message: 'Đăng xuất thành công',
      },
    },
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUser() user: any,
  ) {
    return this.authService.logout(refreshTokenDto, user.id);
  }
}
