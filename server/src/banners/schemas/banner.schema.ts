import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BannerDocument = HydratedDocument<Banner>;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  subtitle: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: '' })
  linkUrl: string;

  @Prop({ default: 'home-hero' })
  placement: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
