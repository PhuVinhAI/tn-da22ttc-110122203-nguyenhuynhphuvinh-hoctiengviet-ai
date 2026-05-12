import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabulariesService } from '../application/vocabularies.service';
import { BookmarksService } from '../application/bookmarks.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
import { Public } from '../../../common/decorators';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { BookmarkQueryDto, BookmarkSort } from '../dto/bookmark-query.dto';
import { Vocabulary } from '../domain/vocabulary.entity';

@ApiTags('Vocabularies')
@Controller('vocabularies')
export class VocabulariesController {
  constructor(
    private readonly vocabulariesService: VocabulariesService,
    private readonly bookmarksService: BookmarksService,
    private readonly storageService: StorageService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('bookmarks/stats')
  @ApiOperation({
    summary: 'Lấy thống kê từ vựng đã bookmark',
    description: 'Trả về tổng số từ đã bookmark và phân bố theo partOfSpeech.',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê từ vựng đã bookmark',
    schema: {
      example: {
        total: 25,
        byPartOfSpeech: { noun: 12, verb: 8, adjective: 5 },
      },
    },
  })
  async getBookmarkStats(@CurrentUser() user: User) {
    return this.bookmarksService.getStats(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('bookmarks')
  @ApiOperation({
    summary: 'Lấy danh sách từ vựng đã bookmark',
    description:
      'Lấy danh sách từ vựng đã bookmark của user, hỗ trợ phân trang, tìm kiếm và sắp xếp.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách từ vựng đã bookmark',
    schema: {
      example: {
        data: [
          {
            bookmarkedAt: '2024-01-15T00:00:00.000Z',
            vocabulary: {
              id: 'uuid-string',
              word: 'xin chào',
              translation: 'hello',
              phonetic: 'sin chao',
              partOfSpeech: 'PHRASE',
            },
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    },
  })
  async getBookmarks(
    @CurrentUser() user: User,
    @Query() query: BookmarkQueryDto,
  ) {
    return this.bookmarksService.list(user.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      sort: query.sort ?? BookmarkSort.NEWEST,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/bookmark')
  @ApiOperation({
    summary: 'Toggle bookmark từ vựng',
    description:
      'Đánh dấu hoặc bỏ đánh dấu từ vựng. Nếu chưa bookmark → tạo; nếu đã bookmark → xoá.',
  })
  @ApiParam({ name: 'vocabularyId', description: 'ID của từ vựng' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả toggle bookmark',
    schema: { example: { isBookmarked: true } },
  })
  async toggleBookmark(
    @CurrentUser() user: User,
    @Param('vocabularyId') vocabularyId: string,
  ) {
    return this.bookmarksService.toggle(user.id, vocabularyId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm từ vựng',
    description:
      'Tìm kiếm từ vựng theo word, translation hoặc phonetic. Trả về tối đa 50 kết quả. Nếu user đã đăng nhập, mỗi kết quả bao gồm isBookmarked.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tìm kiếm',
    schema: {
      example: [
        {
          id: 'uuid-string',
          word: 'xin chào',
          translation: 'hello',
          phonetic: 'sin chao',
          partOfSpeech: 'PHRASE',
          isBookmarked: false,
        },
      ],
    },
  })
  async search(@Query('q') query: string, @CurrentUser() user?: User) {
    const vocabularies = await this.vocabulariesService.search(query);
    return this.vocabulariesService.enrichWithBookmarks(vocabularies, user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy từ vựng theo lesson',
    description:
      'Lấy tất cả từ vựng thuộc một lesson. Nếu user đã đăng nhập, sẽ tự động áp dụng dialect preference của user.',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách từ vựng',
    schema: {
      example: [
        {
          id: 'uuid-string',
          word: 'xin chào',
          translation: 'hello',
          phonetic: 'sin chao',
          partOfSpeech: 'PHRASE',
          exampleSentence: 'Xin chào, bạn khỏe không?',
          exampleTranslation: 'Hello, how are you?',
          audioUrl: 'https://example.com/audio.mp3',
          imageUrl: 'https://example.com/image.jpg',
          difficultyLevel: 1,
          classifier: 'con',
          region: 'SOUTHERN',
        },
      ],
    },
  })
  async findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user?: User,
  ) {
    let vocabularies: Vocabulary[];
    if (user?.preferredDialect) {
      vocabularies = await this.vocabulariesService.findByLessonIdWithDialect(
        lessonId,
        user.preferredDialect,
      );
    } else {
      vocabularies = await this.vocabulariesService.findByLessonId(lessonId);
    }
    return this.vocabulariesService.enrichWithBookmarks(vocabularies, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo từ vựng mới',
    description: 'Tạo từ vựng mới trong lesson - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateVocabularyDto })
  @ApiResponse({ status: 201, description: 'Tạo từ vựng thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createVocabularyDto: CreateVocabularyDto) {
    return this.vocabulariesService.create(createVocabularyDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật từ vựng',
    description: 'Cập nhật thông tin từ vựng - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng' })
  @ApiBody({ type: CreateVocabularyDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng' })
  async update(
    @Param('id') id: string,
    @Body() updateVocabularyDto: Partial<CreateVocabularyDto>,
  ) {
    return this.vocabulariesService.update(id, updateVocabularyDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa từ vựng',
    description: 'Xóa từ vựng khỏi lesson - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Vocabulary deleted successfully' } },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng' })
  async remove(@Param('id') id: string) {
    return this.vocabulariesService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-audio')
  @ApiOperation({
    summary: 'Upload audio cho từ vựng',
    description: 'Upload file audio phát âm cho từ vựng',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File audio (mp3, wav, ogg)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload thành công',
    schema: {
      example: {
        url: 'https://example.com/audio/filename.mp3',
        filename: 'filename.mp3',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    const uploaded = await this.storageService.uploadAudio(
      file.buffer,
      file.originalname,
    );
    return {
      url: uploaded.url,
      filename: uploaded.filename,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @ApiOperation({
    summary: 'Upload hình ảnh cho từ vựng',
    description: 'Upload file hình ảnh minh họa cho từ vựng',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File hình ảnh (jpg, png, webp)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload thành công',
    schema: {
      example: {
        url: 'https://example.com/images/filename.jpg',
        filename: 'filename.jpg',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const uploaded = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
    );
    return {
      url: uploaded.url,
      filename: uploaded.filename,
    };
  }
}
