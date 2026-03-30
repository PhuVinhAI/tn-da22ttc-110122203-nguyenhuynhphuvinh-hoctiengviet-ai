import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lấy từ vựng theo lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.vocabulariesService.findByLessonId(lessonId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo từ vựng mới' })
  async create(@Body() createVocabularyDto: CreateVocabularyDto) {
    return this.vocabulariesService.create(createVocabularyDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật từ vựng' })
  async update(@Param('id') id: string, @Body() updateVocabularyDto: Partial<CreateVocabularyDto>) {
    return this.vocabulariesService.update(id, updateVocabularyDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa từ vựng' })
  async remove(@Param('id') id: string) {
    return this.vocabulariesService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/learn')
  @ApiOperation({ summary: 'Thêm từ vựng vào danh sách học' })
  async addToLearning(
    @CurrentUser() user: User,
    @Param('vocabularyId') vocabularyId: string,
  ) {
    return this.userVocabulariesService.addVocabulary(user.id, vocabularyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':vocabularyId/review')
  @ApiOperation({ summary: 'Ôn tập từ vựng' })
  async reviewVocabulary(
    @CurrentUser() user: User,
    @Param('vocabularyId') vocabularyId: string,
    @Body() body: { isCorrect: boolean },
  ) {
    return this.userVocabulariesService.reviewVocabulary(
      user.id,
      vocabularyId,
      body.isCorrect,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-vocabularies')
  @ApiOperation({ summary: 'Lấy danh sách từ vựng đã học' })
  async getMyVocabularies(@CurrentUser() user: User) {
    return this.userVocabulariesService.getUserVocabularies(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('due-review')
  @ApiOperation({ summary: 'Lấy từ vựng cần ôn tập' })
  async getDueForReview(@CurrentUser() user: User) {
    return this.userVocabulariesService.getDueForReview(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upload-audio')
  @ApiOperation({ summary: 'Upload audio cho từ vựng' })
  @ApiConsumes('multipart/form-data')
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
  @ApiOperation({ summary: 'Upload hình ảnh cho từ vựng' })
  @ApiConsumes('multipart/form-data')
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
