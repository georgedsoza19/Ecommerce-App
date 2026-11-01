import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { AddressesService } from '../addresses/addresses.service';
import { CartsService } from '../carts/carts.service';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { PAYMENT_GATEWAY } from '../payments/payment-gateway';
import type { PaymentGateway } from '../payments/payment-gateway';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { SettingsService } from '../settings/settings.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private cartsService: CartsService,
    private addressesService: AddressesService,
    private settingsService: SettingsService,
    @Inject(PAYMENT_GATEWAY) private paymentGateway: PaymentGateway,
  ) {}

  private async nextOrderNumber() {
    const count = await this.orderModel.countDocuments();
    return `GEO-${String(count + 1).padStart(6, '0')}`;
  }

  mapOrder(order: OrderDocument) {
    return {
      id: String(order._id),
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        productId: String(i.productId),
        name: i.name,
        sku: i.sku,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
        lineTotalCents: i.unitPriceCents * i.quantity,
        imageUrl: i.imageUrl,
      })),
      shippingAddress: order.shippingAddress,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      status: order.status,
      couponCode: order.couponCode,
      paymentRef: order.paymentRef,
      paidAt: order.paidAt,
      createdAt: (order as unknown as { createdAt: Date }).createdAt,
      updatedAt: (order as unknown as { updatedAt: Date }).updatedAt,
    };
  }

  async createOrder(userId: string, addressId: string) {
    const address = await this.addressesService.getOwned(userId, addressId);
    const { cart } = await this.cartsService.getPricedCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException({
        code: 'CART_EMPTY',
        message: 'Your cart is empty',
      });
    }

    for (const line of cart.items) {
      const product = await this.productModel.findById(line.productId);
      if (!product || !product.active || product.stock < line.quantity) {
        throw new BadRequestException({
          code: 'STOCK_CHANGED',
          message: `${line.name} is no longer available in the requested quantity`,
        });
      }
      if (product.priceCents !== line.unitPriceCents) {
        throw new BadRequestException({
          code: 'PRICE_CHANGED',
          message: `Price for ${line.name} has changed. Refresh your cart.`,
        });
      }
    }

    const order = await this.orderModel.create({
      orderNumber: await this.nextOrderNumber(),
      userId: new Types.ObjectId(userId),
      items: cart.items.map((i) => ({
        productId: new Types.ObjectId(i.productId),
        name: i.name,
        sku: i.sku,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
        imageUrl: i.imageUrl,
      })),
      shippingAddress: {
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
      },
      subtotalCents: cart.subtotalCents,
      discountCents: cart.discountCents,
      shippingCents: cart.shippingCents,
      taxCents: cart.taxCents,
      totalCents: cart.totalCents,
      status: OrderStatus.PENDING_PAYMENT,
      couponCode: cart.coupon?.code ?? null,
    });

    return { order: this.mapOrder(order) };
  }

  async confirmPayment(userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }
    if (String(order.userId) !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You cannot pay for this order',
      });
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException({
        code: 'ORDER_NOT_PAYABLE',
        message: 'Order is not awaiting payment',
      });
    }

    const user = await this.userModel.findById(userId);
    const settings = await this.settingsService.getOrCreate();
    const charge = await this.paymentGateway.charge({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      amountCents: order.totalCents,
      currency: settings.currency,
      customerEmail: user?.email ?? '',
    });

    if (!charge.success) {
      throw new BadRequestException({
        code: 'PAYMENT_FAILED',
        message: charge.message || 'Payment failed',
      });
    }

    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      for (const item of order.items) {
        const updated = await this.productModel.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { session, returnDocument: 'after' },
        );
        if (!updated) {
          throw new BadRequestException({
            code: 'STOCK_CHANGED',
            message: `Insufficient stock for ${item.name}`,
          });
        }
      }

      if (order.couponCode) {
        await this.couponModel.updateOne(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } },
          { session },
        );
      }

      order.status = OrderStatus.PAID;
      order.paymentRef = charge.paymentRef;
      order.paidAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await this.cartsService.clear(userId);
    return { order: this.mapOrder(order) };
  }
}
