import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  WishlistItem,
  WishlistItemDocument,
} from './schemas/wishlist.schema';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectModel(WishlistItem.name)
    private wishlistModel: Model<WishlistItemDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async list(userId: string) {
    const items = await this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('productId');

    return {
      items: items
        .filter((i) => i.productId)
        .map((i) => {
          const p = i.productId as unknown as ProductDocument;
          return {
            id: String(i._id),
            product: {
              id: String(p._id),
              name: p.name,
              slug: p.slug,
              priceCents: p.priceCents,
              stock: p.stock,
              imageUrl: p.images[0]?.url ?? '',
              inStock: p.stock > 0,
            },
          };
        }),
    };
  }

  async add(userId: string, productId: string) {
    const product = await this.productModel.findOne({
      _id: productId,
      active: true,
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }
    try {
      await this.wishlistModel.create({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
      });
    } catch {
      throw new ConflictException({
        code: 'ALREADY_IN_WISHLIST',
        message: 'Product is already in your wishlist',
      });
    }
    return this.list(userId);
  }

  async remove(userId: string, productId: string) {
    await this.wishlistModel.deleteOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    return this.list(userId);
  }
}
