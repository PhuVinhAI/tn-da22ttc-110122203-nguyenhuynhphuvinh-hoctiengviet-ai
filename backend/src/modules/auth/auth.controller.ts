import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from '../../common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới với email, password và thông tin cá nhân. Email xác thực sẽ được gửi tự động.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'user@example.com',
          fullName: 'John Doe',
          nativeLanguage: 'English',
          currentLevel: 'A1',
          emailVerified: false,
          roles: [{ name: 'USER' }],
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        accessToken: 'jwt-token-string',
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
      }
    }
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
    description: 'Đăng nhập bằng email và password để nhận JWT token'
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
          roles: [{ name: 'USER', permissions: [] }]
        },
        accessToken: 'jwt-token-string'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Email hoặc password không đúng' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary: 'Xác thực email',
    description: 'Xác thực email bằng token nhận được từ email'
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Xác thực thành công',
    schema: {
      example: {
        message: 'Email đã được xác thực thành công!'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Quên mật khẩu',
    description: 'Gửi email chứa link đặt lại mật khẩu'
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email đã được gửi',
    schema: {
      example: {
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.'
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu mới bằng token từ email'
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    schema: {
      example: {
        message: 'Mật khẩu đã được đặt lại thành công!'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('resend-verification')
  @ApiOperation({
    summary: 'Gửi lại email xác thực',
    description: 'Gửi lại email xác thực cho user chưa verify'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Email đã được gửi lại',
    schema: {
      example: {
        message: 'Email xác thực đã được gửi lại!'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Email đã được xác thực' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
