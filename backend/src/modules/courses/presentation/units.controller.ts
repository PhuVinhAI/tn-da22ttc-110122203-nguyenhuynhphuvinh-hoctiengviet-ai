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
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateUnitDto } from '../dto/units/create-unit.dto';

@ApiTags('Units')
@Controller('units')
export class UnitsController {
  constructor(private readonly courseContentService: CourseContentService) {}

  @Public()
  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Lấy danh sách units theo course',
    description: 'Lấy tất cả units thuộc một khóa học',
  })
  @ApiParam({ name: 'courseId', description: 'ID của khóa học' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách units',
    schema: {
      example: [
        {
          id: 'uuid-string',
          title: 'Unit 1: Chào hỏi và giới thiệu',
          description: 'Học cách chào hỏi và giới thiệu bản thân',
          orderIndex: 1,
          courseId: 'course-uuid',
        },
      ],
    },
  })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.courseContentService.getUnitsByCourse(courseId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết unit',
    description: 'Lấy thông tin chi tiết của unit bao gồm danh sách lessons',
  })
  @ApiParam({ name: 'id', description: 'ID của unit' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết unit',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Unit 1: Chào hỏi và giới thiệu',
        description: 'Học cách chào hỏi và giới thiệu bản thân',
        orderIndex: 1,
        lessons: [
          {
            id: 'lesson-uuid',
            title: 'Bài 1: Từ vựng chào hỏi',
            lessonType: 'VOCABULARY',
            orderIndex: 1,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy unit' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getUnitDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo unit mới',
    description: 'Tạo unit mới trong khóa học - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateUnitDto })
  @ApiResponse({ status: 201, description: 'Tạo unit thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createUnitDto: CreateUnitDto) {
    return this.courseContentService.createUnit(createUnitDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật unit',
    description: 'Cập nhật thông tin unit - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của unit' })
  @ApiBody({ type: CreateUnitDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy unit' })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: Partial<CreateUnitDto>,
  ) {
    return this.courseContentService.updateUnit(id, updateUnitDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa unit',
    description: 'Xóa unit khỏi khóa học - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của unit' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Unit deleted successfully' } },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy unit' })
  async remove(@Param('id') id: string) {
    return this.courseContentService.deleteUnit(id);
  }
}
