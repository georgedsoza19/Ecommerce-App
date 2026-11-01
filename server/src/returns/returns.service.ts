import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import {
  ReturnRequest,
  ReturnRequestDocument,
  ReturnStatus,
} from './schemas/return-request.schema';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectModel(ReturnRequest.name)
    private returnModel: Model<ReturnRequestDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  map(doc: ReturnRequestDocument) {
    return {
      id: String(doc._id),
      orderId: String(doc.orderId),
      userId: String(doc.userId),
      reason: doc.reason,
      status: doc.status,
      adminNote: doc.adminNote,
      createdAt: (doc as unknown as { createdAt: Date }).createdAt,
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
    };
  }

  async create(userId: string, orderId: string, reason: string) {
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
        message: 'You cannot return this order',
      });
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException({
        code: 'RETURN_NOT_ALLOWED',
        message: 'Returns are only available for delivered orders',
      });
    }
    const existing = await this.returnModel.findOne({
      orderId: order._id,
      status: {
        $in: [
          ReturnStatus.REQUESTED,
          ReturnStatus.APPROVED,
          ReturnStatus.REFUNDED,
        ],
      },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'RETURN_EXISTS',
        message: 'A return request already exists for this order',
      });
    }
    const ret = await this.returnModel.create({
      orderId: order._id,
      userId: new Types.ObjectId(userId),
      reason: reason.trim(),
      status: ReturnStatus.REQUESTED,
    });
    return { returnRequest: this.map(ret) };
  }

  async listMine(userId: string) {
    const items = await this.returnModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
    return { returnRequests: items.map((r) => this.map(r)) };
  }

  async listAdmin(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const items = await this.returnModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('orderId')
      .populate('userId', 'email name');
    return {
      returnRequests: items.map((r) => ({
        ...this.map(r),
        orderNumber:
          (r.orderId as unknown as { orderNumber?: string })?.orderNumber ??
          null,
        customer: r.userId
          ? {
              id: String((r.userId as unknown as { _id: Types.ObjectId })._id),
              email: (r.userId as unknown as { email: string }).email,
              name: (r.userId as unknown as { name: string }).name,
            }
          : null,
      })),
    };
  }

  async decide(
    id: string,
    status: ReturnStatus.APPROVED | ReturnStatus.REJECTED | ReturnStatus.REFUNDED,
    adminNote?: string,
  ) {
    const ret = await this.returnModel.findById(id);
    if (!ret) {
      throw new NotFoundException({
        code: 'RETURN_NOT_FOUND',
        message: 'Return request not found',
      });
    }
    ret.status = status;
    if (adminNote !== undefined) ret.adminNote = adminNote;
    await ret.save();
    return { returnRequest: this.map(ret) };
  }
}
