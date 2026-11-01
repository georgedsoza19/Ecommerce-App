import {
  Controller,
  ForbiddenException,
  Headers,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { Model } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';
import { User, UserDocument } from '../users/schemas/user.schema';
import { runSeed } from './run-seed';

/**
 * Free Render has no Shell. Seed via:
 *   curl -X POST https://YOUR-APP.onrender.com/api/seed \
 *     -H "x-seed-secret: $SEED_SECRET"
 */
@Controller('seed')
export class SeedController {
  constructor(
    private readonly config: ConfigService,
    private readonly moduleRef: ModuleRef,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Public()
  @Post()
  async seed(@Headers('x-seed-secret') secret?: string) {
    const expected = this.config.get<string>('SEED_SECRET');
    if (!expected || expected.length < 8) {
      throw new ServiceUnavailableException({
        code: 'SEED_DISABLED',
        message: 'SEED_SECRET is not configured on this server',
      });
    }
    if (!secret || secret !== expected) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Invalid seed secret',
      });
    }

    const existing = await this.userModel.countDocuments();
    const wipe = this.config.get('SEED_ALLOW_WIPE') === 'true';
    if (existing > 0 && !wipe) {
      return {
        ok: true,
        skipped: true,
        message: 'Database already has users. Set SEED_ALLOW_WIPE=true to reset.',
      };
    }

    const result = await runSeed(this.moduleRef, {
      wipe: existing > 0 ? wipe : true,
    });
    return {
      ok: true,
      skipped: false,
      ...result,
    };
  }
}
