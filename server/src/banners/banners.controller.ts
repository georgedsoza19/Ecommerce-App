import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { BannersService } from './banners.service';

class BannerBody {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@Controller()
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get('banners')
  listPublic(@Query('placement') placement?: string) {
    return this.bannersService.listPublic(placement);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/banners')
  listAdmin() {
    return this.bannersService.listAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/banners')
  create(@Body() dto: BannerBody) {
    return this.bannersService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/banners/:id')
  update(@Param('id') id: string, @Body() dto: Partial<BannerBody>) {
    return this.bannersService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/banners/:id')
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
