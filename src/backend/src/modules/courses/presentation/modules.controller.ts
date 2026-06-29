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
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { CreateModuleDto } from '../dto/modules/create-module.dto';

@ApiTags('Modules')
@Controller('modules')
@UseGuards(PermissionsGuard)
export class ModulesController {
  constructor(private readonly courseContentService: CourseContentService) {}

  @Public()
  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Lấy danh sách modules theo course',
    description: 'Lấy tất cả modules thuộc một khóa học',
  })
  @ApiParam({ name: 'courseId', description: 'ID của khóa học' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách modules',
    schema: {
      example: [
        {
          id: 'uuid-string',
          title: 'Module 1: Chào hỏi và giới thiệu',
          description: 'Học cách chào hỏi và giới thiệu bản thân',
          orderIndex: 1,
          estimatedHours: 10,
          courseId: 'course-uuid',
        },
      ],
    },
  })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.courseContentService.getModulesByCourse(courseId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết module',
    description: 'Lấy thông tin chi tiết của module bao gồm danh sách lessons',
  })
  @ApiParam({ name: 'id', description: 'ID của module' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết module',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Module 1: Chào hỏi và giới thiệu',
        description: 'Học cách chào hỏi và giới thiệu bản thân',
        orderIndex: 1,
        estimatedHours: 10,
        lessons: [
          {
            id: 'lesson-uuid',
            title: 'Bài 1: Từ vựng chào hỏi',
            orderIndex: 1,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getModuleDetail(id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermissions(Permission.MODULE_CREATE)
  @ApiOperation({
    summary: 'Tạo module mới',
    description: 'Tạo module mới trong khóa học - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({ status: 201, description: 'Tạo module thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền MODULE_CREATE' })
  async create(@Body() createModuleDto: CreateModuleDto) {
    return this.courseContentService.createModule(createModuleDto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermissions(Permission.MODULE_UPDATE)
  @ApiOperation({
    summary: 'Cập nhật module',
    description: 'Cập nhật thông tin module - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của module' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền MODULE_UPDATE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  async update(
    @Param('id') id: string,
    @Body() updateModuleDto: Partial<CreateModuleDto>,
  ) {
    return this.courseContentService.updateModule(id, updateModuleDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermissions(Permission.MODULE_DELETE)
  @ApiOperation({
    summary: 'Xóa module',
    description: 'Xóa module khỏi khóa học - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của module' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Module deleted successfully' } },
  })
  @ApiResponse({ status: 403, description: 'Không có quyền MODULE_DELETE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy module' })
  async remove(@Param('id') id: string) {
    return this.courseContentService.deleteModule(id);
  }
}
