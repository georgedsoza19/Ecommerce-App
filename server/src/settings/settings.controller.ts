import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { SettingsService } from './settings.service';

class UpdateSettingsBody {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  flatShippingCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  freeShippingThresholdCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxRateBps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('settings')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/settings')
  getAdmin() {
    return this.settingsService.getAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/settings')
  update(@Body() dto: UpdateSettingsBody) {
    return this.settingsService.update(dto);
  }
}
