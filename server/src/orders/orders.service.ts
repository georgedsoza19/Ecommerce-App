import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckoutService } from '../checkout/checkout.service';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private checkoutService: CheckoutService,
  ) {}

  async listMine(userId: string) {
    const orders = await this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
    return {
      orders: orders.map((o) => this.checkoutService.mapOrder(o)),
    };
  }

  async getMine(userId: string, id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }
    if (String(order.userId) !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You cannot view this order',
      });
    }
    return { order: this.checkoutService.mapOrder(order) };
  }

  async listAdmin(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const orders = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'email name');
    return {
      orders: orders.map((o) => {
        const user = o.userId as unknown as {
          _id: Types.ObjectId;
          email: string;
          name: string;
        };
        return {
          ...this.checkoutService.mapOrder(o),
          customer: user?._id
            ? {
                id: String(user._id),
                email: user.email,
                name: user.name,
              }
            : null,
        };
      }),
    };
  }

  async getAdmin(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'email name');
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }
    const user = order.userId as unknown as {
      _id: Types.ObjectId;
      email: string;
      name: string;
    };
    return {
      order: {
        ...this.checkoutService.mapOrder(order),
        customer: user?._id
          ? {
              id: String(user._id),
              email: user.email,
              name: user.name,
            }
          : null,
      },
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }
    order.status = status;
    await order.save();
    return { order: this.checkoutService.mapOrder(order) };
  }
}
