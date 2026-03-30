import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GrammarService } from '../application/grammar.service';
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateGrammarDto } from '../dto/create-grammar.dto';

@ApiTags('Grammar')
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Lấy ngữ pháp theo lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.grammarService.findByLessonId(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết ngữ pháp' })
  async findOne(@Param('id') id: string) {
    return this.grammarService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo ngữ pháp mới' })
  async create(@Body() createGrammarDto: CreateGrammarDto) {
    return this.grammarService.create(createGrammarDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ngữ pháp' })
  async update(@Param('id') id: string, @Body() updateGrammarDto: Partial<CreateGrammarDto>) {
    return this.grammarService.update(id, updateGrammarDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ngữ pháp' })
  async remove(@Param('id') id: string) {
    return this.grammarService.delete(id);
  }
}
