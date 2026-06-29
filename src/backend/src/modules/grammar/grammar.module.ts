import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrammarRule } from './domain/grammar-rule.entity';
import { GrammarController } from './presentation/grammar.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrammarRule]),
    forwardRef(() => CoursesModule),
  ],
  controllers: [GrammarController],
  providers: [],
  exports: [],
})
export class GrammarModule {}
