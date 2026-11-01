import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CheckoutService } from './checkout.service';

class CreateCheckoutDto {
  @IsString()
  addressId: string;
}

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckoutDto) {
    return this.checkoutService.createOrder(user.userId, dto.addressId);
  }

  @Post(':orderId/confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.checkoutService.confirmPayment(user.userId, orderId);
  }
}
