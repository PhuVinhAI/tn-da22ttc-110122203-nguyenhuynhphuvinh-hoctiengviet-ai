import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ 
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới với email, password và thông tin cá nhân'
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
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        accessToken: 'jwt-token-string'
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
          currentLevel: 'A1'
        },
        accessToken: 'jwt-token-string'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Email hoặc password không đúng' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
