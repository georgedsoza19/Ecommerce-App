import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CartsService } from './carts.service';

class AddCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity: number;
}

class ApplyCouponDto {
  @IsString()
  @MinLength(2)
  code: string;
}

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cartsService.getPricedCart(user.userId);
  }

  @Post('items')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(user.userId, dto.productId, dto.quantity);
  }

  @Patch('items/:productId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(user.userId, productId, dto.quantity);
  }

  @Delete('items/:productId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.cartsService.removeItem(user.userId, productId);
  }

  @Post('coupon')
  applyCoupon(@CurrentUser() user: AuthUser, @Body() dto: ApplyCouponDto) {
    return this.cartsService.applyCoupon(user.userId, dto.code);
  }

  @Delete('coupon')
  removeCoupon(@CurrentUser() user: AuthUser) {
    return this.cartsService.removeCoupon(user.userId);
  }
}
