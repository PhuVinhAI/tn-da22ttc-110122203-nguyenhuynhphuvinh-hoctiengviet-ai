import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLevel, Dialect } from '../../../common/enums';

export class OnboardingDto {
  @ApiProperty({
    enum: UserLevel,
    example: UserLevel.B1,
    description: 'Current proficiency level selected during onboarding',
  })
  @IsEnum(UserLevel)
  currentLevel: UserLevel;

  @ApiProperty({
    enum: Dialect,
    example: Dialect.NORTHERN,
    description: 'Preferred Vietnamese dialect',
    required: false,
  })
  @IsEnum(Dialect)
  @IsOptional()
  preferredDialect?: Dialect;

  @ApiProperty({
    example: true,
    description:
      'Whether to mark all courses below the selected level as completed',
  })
  @IsBoolean()
  completeLowerCourses: boolean;

  @ApiProperty({
    example: 'Vietnamese',
    description: 'Learner native language selected during onboarding',
    required: false,
  })
  @IsString()
  @IsOptional()
  nativeLanguage?: string;
}
