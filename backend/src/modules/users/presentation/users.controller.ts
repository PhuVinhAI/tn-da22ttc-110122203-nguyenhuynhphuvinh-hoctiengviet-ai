import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service';
import { ProgressService } from '../../progress/application/progress.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../domain/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { OnboardingDto } from '../dto/onboarding.dto';
import { isLevelHigher } from '../../progress/application/progress-transaction.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly progressService: ProgressService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Lấy thông tin user hiện tại',
    description: 'Lấy thông tin profile của user đang đăng nhập',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user',
    schema: {
      example: {
        id: 'uuid-string',
        email: 'user@example.com',
        fullName: 'John Doe',
        nativeLanguage: 'English',
        currentLevel: 'A1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Cập nhật thông tin user',
    description: 'Cập nhật thông tin profile của user đang đăng nhập',
  })
  @ApiBody({
    schema: {
      example: {
        fullName: 'John Smith',
        nativeLanguage: 'English',
        currentLevel: 'A2',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    schema: {
      example: {
        id: 'uuid-string',
        email: 'user@example.com',
        fullName: 'John Smith',
        nativeLanguage: 'English',
        currentLevel: 'A2',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateData: UpdateUserDto,
  ) {
    const previousLevel = user.currentLevel;
    const updatedUser = await this.usersService.update(user.id, updateData);

    if (
      updateData.currentLevel &&
      isLevelHigher(updateData.currentLevel, previousLevel)
    ) {
      await this.progressService.completeAllLowerCourses(
        updatedUser.id,
        updatedUser.currentLevel,
      );
    }

    return updatedUser;
  }

  @Post('onboarding')
  @ApiOperation({
    summary: 'Hoàn thành onboarding',
    description:
      'Cập nhật level, dialect, và tuỳ chọn đánh dấu hoàn thành các course thấp hơn',
  })
  @ApiBody({ type: OnboardingDto })
  @ApiResponse({
    status: 200,
    description: 'Onboarding thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async onboarding(
    @CurrentUser() user: User,
    @Body() onboardingData: OnboardingDto,
  ) {
    const updatedUser = await this.usersService.update(user.id, {
      currentLevel: onboardingData.currentLevel,
      preferredDialect: onboardingData.preferredDialect,
      onboardingCompleted: true,
    });

    if (onboardingData.completeLowerCourses) {
      await this.progressService.completeAllLowerCourses(
        updatedUser.id,
        updatedUser.currentLevel,
      );
    }

    return updatedUser;
  }
}
