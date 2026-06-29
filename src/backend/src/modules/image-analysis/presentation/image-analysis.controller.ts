import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { User } from '../../users/domain/user.entity';
import { ImageAnalysisService } from '../application/image-analysis.service';
import { AnalyzeImageDto } from '../dto/analyze-image.dto';

@ApiTags('Image Analysis')
@ApiBearerAuth()
@Controller('image-analysis')
@UseGuards(PermissionsGuard)
export class ImageAnalysisController {
  constructor(private readonly imageAnalysisService: ImageAnalysisService) {}

  @Post('analyze')
  @HttpCode(200)
  @RequirePermissions(Permission.AI_CHAT)
  @ApiOperation({
    summary: 'Analyze a learner image with AI',
    description:
      'Stateless image discovery endpoint. Accepts up to five base64 images, chat history, and a prompt; returns a markdown answer with extracted vocabulary.',
  })
  @ApiBody({ type: AnalyzeImageDto })
  @ApiResponse({
    status: 200,
    description: 'Structured image analysis response',
    schema: {
      example: {
        text: '**Biển này** có nghĩa là không đỗ xe.',
        vocabularies: [
          {
            word: 'cấm đỗ xe',
            translation: 'no parking',
            partOfSpeech: 'phrase',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or AI response' })
  @ApiResponse({ status: 403, description: 'Missing AI_CHAT permission' })
  @ApiResponse({ status: 503, description: 'AI service failure' })
  async analyze(@CurrentUser() user: User, @Body() dto: AnalyzeImageDto) {
    return this.imageAnalysisService.analyze(dto, user);
  }
}
