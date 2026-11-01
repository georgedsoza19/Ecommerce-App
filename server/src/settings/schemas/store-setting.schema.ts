import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoreSettingDocument = HydratedDocument<StoreSetting>;

@Schema({ timestamps: true })
export class StoreSetting {
  @Prop({ required: true, default: 'Geo' })
  storeName: string;

  @Prop({ required: true, default: 'support@geo.shop' })
  supportEmail: string;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, default: 799 })
  flatShippingCents: number;

  @Prop({ required: true, default: 7500 })
  freeShippingThresholdCents: number;

  /** Basis points: 825 = 8.25% */
  @Prop({ required: true, default: 825 })
  taxRateBps: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

export const StoreSettingSchema = SchemaFactory.createForClass(StoreSetting);
