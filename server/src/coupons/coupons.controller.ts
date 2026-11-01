import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CouponsService } from './coupons.service';
import { CouponType } from './schemas/coupon.schema';

class CouponBody {
  @IsString()
  @MinLength(3)
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsInt()
  @Min(0)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotalCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountCents?: number | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string | null;
}

@Controller('admin/coupons')
@Roles(UserRole.ADMIN)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  list() {
    return this.couponsService.listAdmin();
  }

  @Post()
  create(@Body() dto: CouponBody) {
    return this.couponsService.create({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minSubtotalCents: dto.minSubtotalCents,
      maxDiscountCents: dto.maxDiscountCents,
      usageLimit: dto.usageLimit,
      active: dto.active,
      categoryId: dto.categoryId ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CouponBody>) {
    return this.couponsService.update(id, {
      ...dto,
      startsAt:
        dto.startsAt === undefined
          ? undefined
          : dto.startsAt
            ? new Date(dto.startsAt)
            : null,
      endsAt:
        dto.endsAt === undefined
          ? undefined
          : dto.endsAt
            ? new Date(dto.endsAt)
            : null,
    } as never);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
