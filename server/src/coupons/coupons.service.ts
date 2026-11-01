import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Coupon,
  CouponDocument,
  CouponType,
} from './schemas/coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  map(doc: CouponDocument) {
    return {
      id: String(doc._id),
      code: doc.code,
      type: doc.type,
      value: doc.value,
      minSubtotalCents: doc.minSubtotalCents,
      maxDiscountCents: doc.maxDiscountCents,
      startsAt: doc.startsAt,
      endsAt: doc.endsAt,
      usageLimit: doc.usageLimit,
      usedCount: doc.usedCount,
      active: doc.active,
      categoryId: doc.categoryId ? String(doc.categoryId) : null,
    };
  }

  async listAdmin() {
    const coupons = await this.couponModel.find().sort({ createdAt: -1 });
    return { coupons: coupons.map((c) => this.map(c)) };
  }

  async create(data: {
    code: string;
    type: CouponType;
    value: number;
    minSubtotalCents?: number;
    maxDiscountCents?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    usageLimit?: number | null;
    active?: boolean;
    categoryId?: string | null;
  }) {
    try {
      const coupon = await this.couponModel.create({
        ...data,
        code: data.code.trim().toUpperCase(),
        categoryId: data.categoryId
          ? new Types.ObjectId(String(data.categoryId))
          : null,
      });
      return { coupon: this.map(coupon) };
    } catch {
      throw new ConflictException({
        code: 'COUPON_EXISTS',
        message: 'Coupon code already exists',
      });
    }
  }

  async update(id: string, data: Partial<Coupon>) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_NOT_FOUND',
        message: 'Coupon not found',
      });
    }
    if (data.code) coupon.code = data.code.trim().toUpperCase();
    if (data.type) coupon.type = data.type;
    if (data.value !== undefined) coupon.value = data.value;
    if (data.minSubtotalCents !== undefined)
      coupon.minSubtotalCents = data.minSubtotalCents;
    if (data.maxDiscountCents !== undefined)
      coupon.maxDiscountCents = data.maxDiscountCents;
    if (data.startsAt !== undefined) coupon.startsAt = data.startsAt;
    if (data.endsAt !== undefined) coupon.endsAt = data.endsAt;
    if (data.usageLimit !== undefined) coupon.usageLimit = data.usageLimit;
    if (data.active !== undefined) coupon.active = data.active;
    if (data.categoryId !== undefined) {
      coupon.categoryId = data.categoryId
        ? new Types.ObjectId(String(data.categoryId))
        : null;
    }
    try {
      await coupon.save();
    } catch {
      throw new ConflictException({
        code: 'COUPON_EXISTS',
        message: 'Coupon code already exists',
      });
    }
    return { coupon: this.map(coupon) };
  }

  async remove(id: string) {
    const coupon = await this.couponModel.findByIdAndDelete(id);
    if (!coupon) {
      throw new NotFoundException({
        code: 'COUPON_NOT_FOUND',
        message: 'Coupon not found',
      });
    }
    return { ok: true };
  }

  async validateForCart(params: {
    codeOrId: string;
    byId?: boolean;
    subtotalCents: number;
    categoryIds: string[];
  }): Promise<CouponDocument> {
    const coupon = params.byId
      ? await this.couponModel.findById(params.codeOrId)
      : await this.couponModel.findOne({
          code: params.codeOrId.trim().toUpperCase(),
        });

    if (!coupon || !coupon.active) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'This promo code is not valid',
      });
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException({
        code: 'COUPON_NOT_STARTED',
        message: 'This promo code is not active yet',
      });
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestException({
        code: 'COUPON_EXPIRED',
        message: 'This promo code has expired',
      });
    }
    if (
      coupon.usageLimit != null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException({
        code: 'COUPON_EXHAUSTED',
        message: 'This promo code has reached its usage limit',
      });
    }
    if (params.subtotalCents < coupon.minSubtotalCents) {
      throw new BadRequestException({
        code: 'COUPON_MIN_NOT_MET',
        message: `Minimum subtotal of ${(coupon.minSubtotalCents / 100).toFixed(2)} required`,
      });
    }
    if (coupon.categoryId) {
      const allowed = String(coupon.categoryId);
      if (!params.categoryIds.includes(allowed)) {
        throw new BadRequestException({
          code: 'COUPON_CATEGORY',
          message: 'This promo code does not apply to items in your cart',
        });
      }
    }
    return coupon;
  }
}
