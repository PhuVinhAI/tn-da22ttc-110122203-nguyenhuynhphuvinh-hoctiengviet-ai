import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
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
    example: 15,
    description: 'Daily study goal in minutes',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(120)
  @IsOptional()
  dailyGoal?: number;

  @ApiProperty({
    example: true,
    description:
      'Whether to mark all courses below the selected level as completed',
  })
  @IsBoolean()
  completeLowerCourses: boolean;
}
