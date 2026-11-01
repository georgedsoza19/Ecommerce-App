import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReturnRequestDocument = HydratedDocument<ReturnRequest>;

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

@Schema({ timestamps: true })
export class ReturnRequest {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ enum: ReturnStatus, default: ReturnStatus.REQUESTED, index: true })
  status: ReturnStatus;

  @Prop({ default: '' })
  adminNote: string;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
