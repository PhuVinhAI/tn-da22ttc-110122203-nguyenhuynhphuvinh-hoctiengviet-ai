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
import { ContentsService } from '../application/contents.service';
import { CourseContentService } from '../../courses/application/course-content.service';
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateContentDto } from '../dto/create-content.dto';

@ApiTags('Contents')
@Controller('contents')
export class ContentsController {
  constructor(
    private readonly contentsService: ContentsService,
    private readonly courseContentService: CourseContentService,
  ) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy nội dung theo lesson',
    description:
      'Lấy tất cả nội dung học thuộc một lesson (text, audio, video, image)',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nội dung',
    schema: {
      example: [
        {
          id: 'uuid-string',
          contentType: 'TEXT',
          vietnameseText: 'Xin chào! Tôi là Minh.',
          translation: 'Hello! I am Minh.',
          phonetic: 'sin chao! toy la min',
          audioUrl: 'https://example.com/audio.mp3',
          imageUrl: 'https://example.com/image.jpg',
          videoUrl: null,
          orderIndex: 1,
          notes: 'Ghi chú thêm',
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
        contentType: 'TEXT',
        vietnameseText: 'Xin chào! Tôi là Minh.',
        translation: 'Hello! I am Minh.',
        phonetic: 'sin chao! toy la min',
        audioUrl: 'https://example.com/audio.mp3',
        orderIndex: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getContentDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo nội dung mới',
    description: 'Tạo nội dung học mới trong lesson - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 201, description: 'Tạo nội dung thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createContentDto: CreateContentDto) {
    return this.contentsService.create(createContentDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật nội dung',
    description: 'Cập nhật thông tin nội dung - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của nội dung' })
  @ApiBody({ type: CreateContentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: Partial<CreateContentDto>,
  ) {
    return this.contentsService.update(id, updateContentDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
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
  @ApiResponse({ status: 404, description: 'Không tìm thấy nội dung' })
  async remove(@Param('id') id: string) {
    return this.contentsService.delete(id);
  }
}
