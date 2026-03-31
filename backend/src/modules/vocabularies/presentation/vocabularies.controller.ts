import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabulariesService } from '../application/vocabularies.service';
import { UserVocabulariesService } from '../application/user-vocabularies.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
import { Public } from '../../../common/decorators';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';

@ApiTags('Vocabularies')
@Controller('vocabularies')
export class VocabulariesController {
  constructor(
    private readonly vocabulariesService: VocabulariesService,
    private readonly userVocabulariesService: UserVocabulariesService,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ 
    summary: 'Lấy từ vựng theo lesson',
    description: 'Lấy tất cả từ vựng thuộc một lesson'
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
          difficultyLevel: 1
        }
      ]
    }
  })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.vocabulariesService.findByLessonId(lessonId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ 
    summary: 'Tạo từ vựng mới',
    description: 'Tạo từ vựng mới trong lesson - yêu cầu quyền Admin'
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
    description: 'Cập nhật thông tin từ vựng - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng' })
  @ApiBody({ type: CreateVocabularyDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng' })
  async update(@Param('id') id: string, @Body() updateVocabularyDto: Partial<CreateVocabularyDto>) {
    return this.vocabulariesService.update(id, updateVocabularyDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa từ vựng',
    description: 'Xóa từ vựng khỏi lesson - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa thành công',
    schema: { example: { message: 'Vocabulary deleted successfully' } }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng' })
  async remove(@Param('id') id: string) {
    return this.vocabulariesService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/learn')
  @ApiOperation({ 
    summary: 'Thêm từ vựng vào danh sách học',
    description: 'Thêm từ vựng vào danh sách học của user để theo dõi tiến độ'
  })
  @ApiParam({ name: 'vocabularyId', description: 'ID của từ vựng' })
  @ApiResponse({
    status: 201,
    description: 'Thêm thành công',
    schema: {
      example: {
        id: 'uuid-string',
        vocabularyId: 'vocab-uuid',
        userId: 'user-uuid',
        masteryLevel: 'NEW',
        reviewCount: 0,
        nextReviewDate: '2024-01-02T00:00:00.000Z'
      }
    }
  })
  async addToLearning(
    @CurrentUser() user: User,
    @Param('vocabularyId') vocabularyId: string,
  ) {
    return this.userVocabulariesService.addVocabulary(user.id, vocabularyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/review')
  @ApiOperation({ 
    summary: 'Ôn tập từ vựng',
    description: 'Ghi nhận kết quả ôn tập từ vựng và cập nhật lịch ôn tập theo thuật toán FSRS. Rating: 1=Again (quên hoàn toàn), 2=Hard (nhớ khó), 3=Good (nhớ đúng), 4=Easy (nhớ dễ dàng)'
  })
  @ApiParam({ name: 'vocabularyId', description: 'ID của từ vựng' })
  @ApiBody({
    schema: {
      example: {
        rating: 3,
        reviewDate: '2024-01-01T00:00:00.000Z'
      },
      properties: {
        rating: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '1=Again (forgot), 2=Hard, 3=Good, 4=Easy'
        },
        reviewDate: {
          type: 'string',
          format: 'date-time',
          description: 'Optional: Custom review date for testing time-based scenarios'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật kết quả ôn tập',
    schema: {
      example: {
        id: 'uuid-string',
        masteryLevel: 'LEARNING',
        reviewCount: 1,
        nextReviewAt: '2024-01-03T00:00:00.000Z',
        lastReviewedAt: '2024-01-01T00:00:00.000Z',
        stability: 2.5,
        difficulty: 5.2,
        scheduledDays: 3
      }
    }
  })
  async reviewVocabulary(
    @CurrentUser() user: User,
    @Param('vocabularyId') vocabularyId: string,
    @Body() body: { rating: number; reviewDate?: string },
  ) {
    const reviewDate = body.reviewDate ? new Date(body.reviewDate) : undefined;
    return this.userVocabulariesService.reviewVocabulary(
      user.id,
      vocabularyId,
      body.rating,
      reviewDate,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-vocabularies')
  @ApiOperation({ 
    summary: 'Lấy danh sách từ vựng đã học',
    description: 'Lấy tất cả từ vựng mà user đã thêm vào danh sách học'
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách từ vựng đã học',
    schema: {
      example: [
        {
          id: 'uuid-string',
          vocabulary: {
            word: 'xin chào',
            translation: 'hello'
          },
          masteryLevel: 'LEARNING',
          reviewCount: 3,
          nextReviewDate: '2024-01-05T00:00:00.000Z'
        }
      ]
    }
  })
  async getMyVocabularies(@CurrentUser() user: User) {
    return this.userVocabulariesService.getUserVocabularies(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('due-review')
  @ApiOperation({ 
    summary: 'Lấy từ vựng cần ôn tập',
    description: 'Lấy danh sách từ vựng đến hạn ôn tập theo lịch spaced repetition'
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách từ vựng cần ôn tập',
    schema: {
      example: [
        {
          id: 'uuid-string',
          vocabulary: {
            word: 'xin chào',
            translation: 'hello',
            audioUrl: 'https://example.com/audio.mp3'
          },
          masteryLevel: 'LEARNING',
          nextReviewDate: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  async getDueForReview(@CurrentUser() user: User) {
    return this.userVocabulariesService.getDueForReview(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-audio')
  @ApiOperation({ 
    summary: 'Upload audio cho từ vựng',
    description: 'Upload file audio phát âm cho từ vựng'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File audio (mp3, wav, ogg)'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Upload thành công',
    schema: {
      example: {
        url: 'https://example.com/audio/filename.mp3',
        filename: 'filename.mp3'
      }
    }
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
    description: 'Upload file hình ảnh minh họa cho từ vựng'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File hình ảnh (jpg, png, webp)'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Upload thành công',
    schema: {
      example: {
        url: 'https://example.com/images/filename.jpg',
        filename: 'filename.jpg'
      }
    }
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
