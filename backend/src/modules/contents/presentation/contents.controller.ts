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
import { CourseContentService } from '../../courses/application/course-content.service';
import { Public, RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { CreateContentDto } from '../dto/create-content.dto';

@ApiTags('Contents')
@Controller('contents')
@UseGuards(PermissionsGuard)
export class ContentsController {
  constructor(private readonly courseContentService: CourseContentService) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy nội dung theo lesson',
    description:
      'Trả về danh sách nội dung học theo orderIndex. Mỗi nội dung mang payload theo content_type — xem schema riêng cho text/image/audio/video.',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nội dung',
    schema: {
      example: [
        {
          id: 'uuid-string',
          contentType: 'text',
          vietnameseText: 'Xin chào! Tôi là Minh.',
          translation: 'Hello! I am Minh.',
          payload: {
            body: 'Xin chào! Tôi là Minh.',
            translation: 'Hello! I am Minh.',
          },
          orderIndex: 1,
          notes: null,
        },
      ],
    },
  })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.courseContentService.getContentsByLesson(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết nội dung',
    description: 'Lấy thông tin chi tiết của một nội dung học',
  })
  @ApiParam({ name: 'id', description: 'ID của nội dung' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết nội dung',
    schema: {
      example: {
        id: 'uuid-string',
        contentType: 'image',
        vietnameseText: 'Phố cổ Hà Nội buổi sáng.',
        translation: 'Hanoi old quarter in the morning.',
        payload: {
          url: '/uploads/image/hanoi.jpg',
          caption: 'Phố cổ Hà Nội buổi sáng.',
          captionEn: 'Hanoi old quarter in the morning.',
          aspectRatio: '16:9',
        },
        orderIndex: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getContentDetail(id);
  }

  @ApiBearerAuth()
  @Post()
  @RequirePermissions(Permission.CONTENT_CREATE)
  @ApiOperation({
    summary: 'Tạo nội dung mới',
    description: 'Tạo nội dung học mới trong lesson - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 201, description: 'Tạo nội dung thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền CONTENT_CREATE' })
  async create(@Body() createContentDto: CreateContentDto) {
    return this.courseContentService.createContent(createContentDto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermissions(Permission.CONTENT_UPDATE)
  @ApiOperation({
    summary: 'Cập nhật nội dung',
    description: 'Cập nhật thông tin nội dung - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của nội dung' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền CONTENT_UPDATE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: Partial<CreateContentDto>,
  ) {
    return this.courseContentService.updateContent(id, updateContentDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermissions(Permission.CONTENT_DELETE)
  @ApiOperation({
    summary: 'Xóa nội dung',
    description: 'Xóa nội dung khỏi lesson - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của nội dung' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Content deleted successfully' } },
  })
  @ApiResponse({ status: 403, description: 'Không có quyền CONTENT_DELETE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async remove(@Param('id') id: string) {
    return this.courseContentService.deleteContent(id);
  }
}
