import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CourseContentService } from '../application/course-content.service';
import { Public, RequirePermissions } from '../../../common/decorators';
import { CurrentUser } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { CreateLessonDto } from '../dto/lessons/create-lesson.dto';

@ApiTags('Lessons')
@Controller('lessons')
@UseGuards(PermissionsGuard)
export class LessonsController {
  constructor(private readonly courseContentService: CourseContentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Lấy danh sách lessons theo module',
    description: 'Lấy tất cả lessons thuộc một module',
  })
  @ApiParam({ name: 'moduleId', description: 'ID của module' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lessons',
  })
  async findByModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() _user: User,
  ) {
    return this.courseContentService.getLessonsByModule(moduleId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết lesson với nội dung đầy đủ',
    description:
      'Lấy thông tin chi tiết lesson bao gồm contents, vocabularies, grammar',
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
        lessonType: 'vocabulary',
        orderIndex: 1,
        estimatedDuration: 30,
        contents: [],
        vocabularies: [],
        grammarRules: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getLessonDetail(id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermissions(Permission.LESSON_CREATE)
  @ApiOperation({
    summary: 'Tạo lesson mới',
    description: 'Tạo lesson mới trong module - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 201, description: 'Tạo lesson thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền LESSON_CREATE' })
  async create(@Body() createLessonDto: CreateLessonDto) {
    return this.courseContentService.createLesson(createLessonDto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermissions(Permission.LESSON_UPDATE)
  @ApiOperation({
    summary: 'Cập nhật lesson',
    description: 'Cập nhật thông tin lesson - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của lesson' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền LESSON_UPDATE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: Partial<CreateLessonDto>,
  ) {
    return this.courseContentService.updateLesson(id, updateLessonDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermissions(Permission.LESSON_DELETE)
  @ApiOperation({
    summary: 'Xóa lesson',
    description: 'Xóa lesson khỏi module - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Lesson deleted successfully' } },
  })
  @ApiResponse({ status: 403, description: 'Không có quyền LESSON_DELETE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lesson' })
  async remove(@Param('id') id: string) {
    return this.courseContentService.deleteLesson(id);
  }
}
