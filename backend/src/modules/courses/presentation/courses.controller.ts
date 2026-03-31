import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CoursesService } from '../application/courses.service';
import { Public, RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(PermissionsGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả khóa học',
    description: 'Trả về danh sách tất cả khóa học có sẵn trong hệ thống'
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khóa học',
    schema: {
      example: [
        {
          id: 'uuid-string',
          title: 'Tiếng Việt Cơ Bản',
          description: 'Khóa học tiếng Việt cho người mới bắt đầu',
          level: 'A1',
          imageUrl: 'https://example.com/image.jpg',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  async findAll() {
    return this.coursesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy chi tiết khóa học',
    description: 'Lấy thông tin chi tiết của một khóa học bao gồm units và lessons'
  })
  @ApiParam({ name: 'id', description: 'ID của khóa học', example: 'uuid-string' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết khóa học',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Tiếng Việt Cơ Bản',
        description: 'Khóa học tiếng Việt cho người mới bắt đầu',
        level: 'A1',
        imageUrl: 'https://example.com/image.jpg',
        units: [
          {
            id: 'unit-uuid',
            title: 'Unit 1: Chào hỏi',
            orderIndex: 1
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermissions(Permission.COURSE_CREATE)
  @ApiOperation({ 
    summary: 'Tạo khóa học mới (Admin only)',
    description: 'Tạo khóa học mới - yêu cầu permission COURSE_CREATE'
  })
  @ApiBody({
    schema: {
      example: {
        title: 'Tiếng Việt Cơ Bản',
        description: 'Khóa học tiếng Việt cho người mới bắt đầu',
        level: 'A1',
        imageUrl: 'https://example.com/image.jpg'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền COURSE_CREATE' })
  async create(@Body() createData: any) {
    return this.coursesService.create(createData);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermissions(Permission.COURSE_UPDATE)
  @ApiOperation({ 
    summary: 'Cập nhật khóa học (Admin only)',
    description: 'Cập nhật thông tin khóa học - yêu cầu permission COURSE_UPDATE'
  })
  @ApiParam({ name: 'id', description: 'ID của khóa học' })
  @ApiBody({
    schema: {
      example: {
        title: 'Tiếng Việt Nâng Cao',
        description: 'Mô tả mới'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền COURSE_UPDATE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.coursesService.update(id, updateData);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermissions(Permission.COURSE_DELETE)
  @ApiOperation({ 
    summary: 'Xóa khóa học (Admin only)',
    description: 'Xóa khóa học khỏi hệ thống - yêu cầu permission COURSE_DELETE'
  })
  @ApiParam({ name: 'id', description: 'ID của khóa học' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa thành công',
    schema: { example: { message: 'Course deleted successfully' } }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền COURSE_DELETE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  async delete(@Param('id') id: string) {
    await this.coursesService.delete(id);
    return { message: 'Course deleted successfully' };
  }
}
