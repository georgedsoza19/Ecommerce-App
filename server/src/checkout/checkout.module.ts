import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesModule } from '../addresses/addresses.module';
import { CartsModule } from '../carts/carts.module';
import { Coupon, CouponSchema } from '../coupons/schemas/coupon.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { PaymentsModule } from '../payments/payments.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { SettingsModule } from '../settings/settings.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CartsModule,
    AddressesModule,
    SettingsModule,
    PaymentsModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
