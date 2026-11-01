import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { SettingsService } from '../settings/settings.service';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  ReturnRequest,
  ReturnRequestDocument,
  ReturnStatus,
} from '../returns/schemas/return-request.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ReturnRequest.name)
    private returnModel: Model<ReturnRequestDocument>,
    private settingsService: SettingsService,
  ) {}

  async metrics() {
    const settings = await this.settingsService.getOrCreate();
    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const [
      revenueAgg,
      orderCount,
      customerCount,
      lowStockCount,
      openReturns,
      recentOrders,
    ] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { status: { $in: paidStatuses } } },
        { $group: { _id: null, total: { $sum: '$totalCents' } } },
      ]),
      this.orderModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.CUSTOMER }),
      this.productModel.countDocuments({
        stock: { $lte: settings.lowStockThreshold },
        active: true,
      }),
      this.returnModel.countDocuments({ status: ReturnStatus.REQUESTED }),
      this.orderModel.find().sort({ createdAt: -1 }).limit(8),
    ]);

    return {
      metrics: {
        revenueCents: revenueAgg[0]?.total ?? 0,
        orderCount,
        customerCount,
        lowStockCount,
        openReturns,
        currency: settings.currency,
      },
      recentOrders: recentOrders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        totalCents: o.totalCents,
        status: o.status,
        createdAt: (o as unknown as { createdAt: Date }).createdAt,
      })),
    };
  }
}
