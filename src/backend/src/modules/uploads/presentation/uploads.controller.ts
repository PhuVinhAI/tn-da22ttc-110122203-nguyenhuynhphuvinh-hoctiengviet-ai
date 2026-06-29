import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UploadsService } from '../application/uploads.service';
import { UploadResponseDto } from '../dto/upload-response.dto';
import type { MediaKind } from '../domain/media-asset.entity';

const VALID_KINDS: ReadonlyArray<MediaKind> = ['image', 'audio', 'video'];

@ApiTags('Admin · Uploads')
@ApiBearerAuth()
@Controller('admin/uploads')
@UseGuards(PermissionsGuard)
@RequirePermissions(Permission.ADMIN_ACCESS)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post(':kind')
  @ApiOperation({ summary: 'Tải file media lên (image/audio/video)' })
  @ApiParam({ name: 'kind', enum: ['image', 'audio', 'video'] })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ): Promise<UploadResponseDto> {
    if (!VALID_KINDS.includes(kind as MediaKind)) {
      throw new BadRequestException(
        `Kind không hợp lệ. Cần một trong: ${VALID_KINDS.join(', ')}`,
      );
    }
    const asset = await this.uploads.upload(kind as MediaKind, file, user?.id);
    return {
      id: asset.id,
      kind: asset.kind,
      url: asset.url,
      filename: asset.filename,
      originalName: asset.originalName,
      mimetype: asset.mimetype,
      size: Number(asset.size),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa tệp theo ID' })
  async deleteById(@Param('id') id: string): Promise<void> {
    await this.uploads.deleteById(id);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa tệp theo URL (?url=...)' })
  async deleteByUrl(@Query('url') url: string): Promise<void> {
    if (!url) throw new BadRequestException('Thiếu tham số ?url');
    await this.uploads.deleteByUrl(url);
  }
}
