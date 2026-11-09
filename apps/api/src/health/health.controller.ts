import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async root() {
    return this.readiness();
  }

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    return this.readiness();
  }

  private async readiness() {
    const timestamp = new Date().toISOString();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp,
        uptime: process.uptime(),
        database: { status: 'up' },
      };
    } catch (error) {
      this.logger.error(
        `health.database.down: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      throw new HttpException(
        {
          status: 'error',
          timestamp,
          uptime: process.uptime(),
          database: {
            status: 'down',
            error: 'Connection to PostgreSQL failed',
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
