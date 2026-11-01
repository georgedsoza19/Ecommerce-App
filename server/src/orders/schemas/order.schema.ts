import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, min: 0 })
  unitPriceCents: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: '' })
  imageUrl: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddressSnapshot {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  line1: string;

  @Prop({ default: '' })
  line2: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({ default: '' })
  phone: string;
}

export const ShippingAddressSnapshotSchema = SchemaFactory.createForClass(
  ShippingAddressSnapshot,
);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddressSnapshotSchema, required: true })
  shippingAddress: ShippingAddressSnapshot;

  @Prop({ required: true, min: 0 })
  subtotalCents: number;

  @Prop({ required: true, min: 0, default: 0 })
  discountCents: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingCents: number;

  @Prop({ required: true, min: 0, default: 0 })
  taxCents: number;

  @Prop({ required: true, min: 0 })
  totalCents: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT, index: true })
  status: OrderStatus;

  @Prop({ type: String, default: null })
  couponCode: string | null;

  @Prop({ type: String, default: null })
  paymentRef: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
