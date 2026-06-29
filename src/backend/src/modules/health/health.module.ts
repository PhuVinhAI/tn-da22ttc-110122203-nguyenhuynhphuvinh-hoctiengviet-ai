import { Controller, Get, Module } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Liveness probe for Docker HEALTHCHECK and orchestrators.
 *
 * Intentionally minimal — only confirms the HTTP server is up and the Nest
 * pipeline can route a request. Deep checks (DB/Redis ping) are deferred to a
 * future readiness probe; a liveness check that fails on a transient DB blip
 * would cause unwanted restarts.
 *
 * `@Public()` so it works even when JwtAuthGuard is global and no token is
 * supplied (Docker healthcheck cannot mint a JWT).
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is up' })
  check() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
