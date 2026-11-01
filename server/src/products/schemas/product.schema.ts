import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop({ default: '' })
  alt: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  priceCents: number;

  @Prop({ type: Number, default: null, min: 0 })
  compareAtCents: number | null;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ name: 'text', description: 'text', sku: 'text' });
ProductSchema.index({ priceCents: 1, stock: 1, active: 1 });
