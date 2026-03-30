import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentsService } from '../application/contents.service';
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateContentDto } from '../dto/create-content.dto';

@ApiTags('Contents')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Lấy nội dung theo lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.contentsService.findByLessonId(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết nội dung' })
  async findOne(@Param('id') id: string) {
    return this.contentsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo nội dung mới' })
  async create(@Body() createContentDto: CreateContentDto) {
    return this.contentsService.create(createContentDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nội dung' })
  async update(@Param('id') id: string, @Body() updateContentDto: Partial<CreateContentDto>) {
    return this.contentsService.update(id, updateContentDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nội dung' })
  async remove(@Param('id') id: string) {
    return this.contentsService.delete(id);
  }
}
