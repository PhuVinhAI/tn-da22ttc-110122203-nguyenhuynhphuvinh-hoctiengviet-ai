import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({ 
    summary: 'Lấy danh sách lessons theo unit',
    description: 'Lấy tất cả lessons thuộc một unit'
  })
  @ApiParam({ name: 'unitId', description: 'ID của unit' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lessons',
    schema: {
      example: [
        {
          id: 'uuid-string',
          title: 'Bài 1: Từ vựng chào hỏi',
          description: 'Học các từ vựng cơ bản về chào hỏi',
          lessonType: 'VOCABULARY',
          orderIndex: 1,
          estimatedDuration: 30
        }
      ]
    }
  })
  async findByUnit(@Param('unitId') unitId: string) {
    return this.lessonsService.findByUnitId(unitId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy chi tiết lesson với nội dung đầy đủ',
    description: 'Lấy thông tin chi tiết lesson bao gồm contents, vocabularies, grammar, exercises'
  })
  @ApiParam({ name: 'id', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết lesson',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Bài 1: Từ vựng chào hỏi',
        description: 'Học các từ vựng cơ bản về chào hỏi',
        lessonType: 'VOCABULARY',
        orderIndex: 1,
        estimatedDuration: 30,
        contents: [],
        vocabularies: [],
        grammarRules: [],
        exercises: []
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ 
    summary: 'Tạo lesson mới',
    description: 'Tạo lesson mới trong unit - yêu cầu quyền Admin'
  })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 201, description: 'Tạo lesson thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật lesson',
    description: 'Cập nhật thông tin lesson - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của lesson' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async update(@Param('id') id: string, @Body() updateLessonDto: Partial<CreateLessonDto>) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa lesson',
    description: 'Xóa lesson khỏi unit - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của lesson' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa thành công',
    schema: { example: { message: 'Lesson deleted successfully' } }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async remove(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
