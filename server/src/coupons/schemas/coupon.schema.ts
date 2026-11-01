import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

export enum CouponType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ enum: CouponType, required: true })
  type: CouponType;

  /** Percent (0-100) or fixed amount in cents */
  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ default: 0, min: 0 })
  minSubtotalCents: number;

  @Prop({ type: Number, default: null })
  maxDiscountCents: number | null;

  @Prop({ type: Date, default: null })
  startsAt: Date | null;

  @Prop({ type: Date, default: null })
  endsAt: Date | null;

  @Prop({ type: Number, default: null })
  usageLimit: number | null;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  categoryId: Types.ObjectId | null;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
