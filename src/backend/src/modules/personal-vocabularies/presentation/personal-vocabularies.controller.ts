import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
import { PersonalVocabulariesService } from '../application/personal-vocabularies.service';
import { CreatePersonalVocabularyDto } from '../dto/create-personal-vocabulary.dto';
import { CreatePersonalVocabularyFromAnalysisDto } from '../dto/create-personal-vocabulary-from-analysis.dto';
import {
  PersonalVocabularyQueryDto,
  PersonalVocabularySort,
} from '../dto/personal-vocabulary-query.dto';

@ApiTags('Personal Vocabularies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personal-vocabularies')
export class PersonalVocabulariesController {
  constructor(
    private readonly personalVocabulariesService: PersonalVocabulariesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo từ vựng cá nhân mới',
    description:
      'Tạo từ vựng cá nhân (Từ vựng cá nhân) cho Học viên đang đăng nhập.',
  })
  @ApiResponse({ status: 201, description: 'Tạo từ vựng cá nhân thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(
    @CurrentUser() user: User,
    @Body() createDto: CreatePersonalVocabularyDto,
  ) {
    return this.personalVocabulariesService.create(user.id, createDto);
  }

  @Post('from-analysis')
  @ApiOperation({
    summary: 'Tạo từ vựng cá nhân từ phân tích ảnh AI',
    description:
      'Tạo từ vựng cá nhân và bookmark trong cùng một transaction từ kết quả AI image discovery.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo từ vựng cá nhân từ phân tích ảnh thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createFromAnalysis(
    @CurrentUser() user: User,
    @Body() createDto: CreatePersonalVocabularyFromAnalysisDto,
  ) {
    return this.personalVocabulariesService.createFromAnalysis(
      user.id,
      createDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách từ vựng cá nhân',
    description:
      'Lấy danh sách từ vựng cá nhân của Học viên đang đăng nhập, hỗ trợ phân trang, tìm kiếm và sắp xếp.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách từ vựng cá nhân',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async list(
    @CurrentUser() user: User,
    @Query() query: PersonalVocabularyQueryDto,
  ) {
    return this.personalVocabulariesService.list(user.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search,
      sort: query.sort ?? PersonalVocabularySort.NEWEST,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết từ vựng cá nhân',
    description:
      'Lấy chi tiết từ vựng cá nhân theo ID. Trả về 404 nếu không tìm thấy hoặc không thuộc Học viên.',
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng cá nhân' })
  @ApiResponse({ status: 200, description: 'Chi tiết từ vựng cá nhân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng cá nhân' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async findById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.personalVocabulariesService.findById(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xoá từ vựng cá nhân',
    description:
      'Xoá mềm từ vựng cá nhân. Trả về 403 nếu không thuộc Học viên.',
  })
  @ApiParam({ name: 'id', description: 'ID của từ vựng cá nhân' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng cá nhân' })
  @ApiResponse({ status: 403, description: 'Không có quyền xoá' })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    await this.personalVocabulariesService.delete(id, user.id);
    return { message: 'Personal vocabulary deleted successfully' };
  }
}
