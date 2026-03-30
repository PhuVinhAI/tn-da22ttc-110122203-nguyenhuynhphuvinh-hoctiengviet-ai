import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from '../application/lessons.service';
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateLessonDto } from '../dto/lessons/create-lesson.dto';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Public()
  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Lấy danh sách lessons theo unit' })
  async findByUnit(@Param('unitId') unitId: string) {
    return this.lessonsService.findByUnitId(unitId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết lesson với nội dung đầy đủ' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo lesson mới' })
  async create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật lesson' })
  async update(@Param('id') id: string, @Body() updateLessonDto: Partial<CreateLessonDto>) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa lesson' })
  async remove(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
