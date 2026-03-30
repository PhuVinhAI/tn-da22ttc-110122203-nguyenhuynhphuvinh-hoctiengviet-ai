import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CacheService } from './cache.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Cache')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('stats')
  @ApiOperation({ 
    summary: 'Lấy thống kê cache',
    description: 'Lấy thông tin thống kê về cache Redis (số keys, memory usage, hit rate...)'
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê cache',
    schema: {
      example: {
        totalKeys: 150,
        memoryUsage: '2.5MB',
        hitRate: 85.5,
        missRate: 14.5,
        uptime: 86400
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getStats() {
    return this.cacheService.getStats();
  }

  @Delete('clear')
  @ApiOperation({ 
    summary: 'Xóa toàn bộ cache',
    description: 'Xóa tất cả cache trong Redis - yêu cầu quyền Admin'
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa cache thành công',
    schema: { example: { message: 'Cache cleared successfully' } }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async clearCache() {
    await this.cacheService.clear();
    return { message: 'Cache cleared successfully' };
  }
}
