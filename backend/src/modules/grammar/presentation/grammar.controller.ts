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
import { Public } from '../../../common/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateGrammarDto } from '../dto/create-grammar.dto';

@ApiTags('Grammar')
@Controller('grammar')
export class GrammarController {
  constructor(private readonly courseContentService: CourseContentService) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy ngữ pháp theo lesson',
    description: 'Lấy tất cả quy tắc ngữ pháp thuộc một lesson',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách ngữ pháp',
    schema: {
      example: [
        {
          id: 'uuid-string',
          title: 'Câu khẳng định với "là"',
          explanation: '"Là" dùng để nối chủ ngữ với danh từ/tính từ',
          structure: 'Chủ ngữ + là + Danh từ',
          examples: [
            { vi: 'Tôi là sinh viên', en: 'I am a student' },
            { vi: 'Anh ấy là giáo viên', en: 'He is a teacher' },
          ],
          notes: 'Lưu ý đặc biệt',
          difficultyLevel: 1,
        },
      ],
    },
  })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.courseContentService.getGrammarByLesson(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết ngữ pháp',
    description: 'Lấy thông tin chi tiết của một quy tắc ngữ pháp',
  })
  @ApiParam({ name: 'id', description: 'ID của ngữ pháp' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết ngữ pháp',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Câu khẳng định với "là"',
        explanation: '"Là" dùng để nối chủ ngữ với danh từ/tính từ',
        structure: 'Chủ ngữ + là + Danh từ',
        examples: [
          { vi: 'Tôi là sinh viên', en: 'I am a student', note: 'Câu cơ bản' },
        ],
        notes: 'Lưu ý đặc biệt',
        difficultyLevel: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngữ pháp' })
  async findOne(@Param('id') id: string) {
    return this.courseContentService.getGrammarDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo ngữ pháp mới',
    description: 'Tạo quy tắc ngữ pháp mới trong lesson - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateGrammarDto })
  @ApiResponse({ status: 201, description: 'Tạo ngữ pháp thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createGrammarDto: CreateGrammarDto) {
    return this.courseContentService.createGrammarRule(createGrammarDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật ngữ pháp',
    description: 'Cập nhật thông tin ngữ pháp - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của ngữ pháp' })
  @ApiBody({ type: CreateGrammarDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngữ pháp' })
  async update(
    @Param('id') id: string,
    @Body() updateGrammarDto: Partial<CreateGrammarDto>,
  ) {
    return this.courseContentService.updateGrammarRule(id, updateGrammarDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa ngữ pháp',
    description: 'Xóa quy tắc ngữ pháp khỏi lesson - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của ngữ pháp' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Grammar deleted successfully' } },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ngữ pháp' })
  async remove(@Param('id') id: string) {
    return this.courseContentService.deleteGrammarRule(id);
  }
}
