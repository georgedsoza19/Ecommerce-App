import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  applyCouponDiscount,
  computeShippingCents,
  computeTaxCents,
} from '../common/utils/money';
import { CouponsService } from '../coupons/coupons.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { SettingsService } from '../settings/settings.service';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private couponsService: CouponsService,
    private settingsService: SettingsService,
  ) {}

  private async getOrCreate(userId: string) {
    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
        couponId: null,
      });
    }
    return cart;
  }

  async getPricedCart(userId: string) {
    const cart = await this.getOrCreate(userId);
    const settings = await this.settingsService.getOrCreate();
    const productIds = cart.items.map((i) => i.productId);
    const products = await this.productModel.find({
      _id: { $in: productIds },
      active: true,
    });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const lines: Array<{
      productId: string;
      name: string;
      slug: string;
      sku: string;
      imageUrl: string;
      unitPriceCents: number;
      quantity: number;
      lineTotalCents: number;
      stock: number;
      categoryId: string;
    }> = [];

    let subtotalCents = 0;
    const categoryIds: string[] = [];

    for (const item of cart.items) {
      const product = productMap.get(String(item.productId));
      if (!product) continue;
      const quantity = Math.min(item.quantity, product.stock);
      if (quantity <= 0) continue;
      const lineTotalCents = product.priceCents * quantity;
      subtotalCents += lineTotalCents;
      categoryIds.push(String(product.categoryId));
      lines.push({
        productId: String(product._id),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        imageUrl: product.images[0]?.url ?? '',
        unitPriceCents: product.priceCents,
        quantity,
        lineTotalCents,
        stock: product.stock,
        categoryId: String(product.categoryId),
      });
    }

    let discountCents = 0;
    let coupon: { id: string; code: string; type: string; value: number } | null =
      null;

    if (cart.couponId && lines.length) {
      try {
        const validated = await this.couponsService.validateForCart({
          codeOrId: String(cart.couponId),
          byId: true,
          subtotalCents,
          categoryIds,
        });
        discountCents = applyCouponDiscount({
          subtotalCents,
          type: validated.type,
          value: validated.value,
          maxDiscountCents: validated.maxDiscountCents,
        });
        coupon = {
          id: String(validated._id),
          code: validated.code,
          type: validated.type,
          value: validated.value,
        };
      } catch {
        cart.couponId = null;
        await cart.save();
      }
    }

    const afterDiscount = Math.max(0, subtotalCents - discountCents);
    const shippingCents = computeShippingCents({
      subtotalAfterDiscountCents: afterDiscount,
      flatShippingCents: settings.flatShippingCents,
      freeShippingThresholdCents: settings.freeShippingThresholdCents,
    });
    const taxCents = computeTaxCents({
      taxableCents: afterDiscount,
      taxRateBps: settings.taxRateBps,
    });
    const totalCents = afterDiscount + shippingCents + taxCents;

    return {
      cart: {
        items: lines,
        itemCount: lines.reduce((n, l) => n + l.quantity, 0),
        coupon,
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents,
        currency: settings.currency,
      },
    };
  }

  async addItem(userId: string, productId: string, quantity = 1) {
    if (quantity < 1) {
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Quantity must be at least 1',
      });
    }
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
    if (product.stock < 1) {
      throw new BadRequestException({
        code: 'OUT_OF_STOCK',
        message: 'Product is out of stock',
      });
    }

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find(
      (i) => String(i.productId) === String(productId),
    );
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stock) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${product.stock} in stock`,
      });
    }
    if (existing) existing.quantity = nextQty;
    else
      cart.items.push({
        productId: new Types.ObjectId(productId),
        quantity,
      });
    await cart.save();
    return this.getPricedCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => String(i.productId) === productId);
    if (!item) {
      throw new NotFoundException({
        code: 'CART_ITEM_NOT_FOUND',
        message: 'Item not in cart',
      });
    }
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => String(i.productId) !== productId);
    } else {
      const product = await this.productModel.findById(productId);
      if (!product || product.stock < quantity) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${product?.stock ?? 0} in stock`,
        });
      }
      item.quantity = quantity;
    }
    await cart.save();
    return this.getPricedCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    return this.updateItem(userId, productId, 0);
  }

  async applyCoupon(userId: string, code: string) {
    const priced = await this.getPricedCart(userId);
    const categoryIds = priced.cart.items.map((i) => i.categoryId);
    const coupon = await this.couponsService.validateForCart({
      codeOrId: code,
      subtotalCents: priced.cart.subtotalCents,
      categoryIds,
    });
    const cart = await this.getOrCreate(userId);
    cart.couponId = coupon._id as Types.ObjectId;
    await cart.save();
    return this.getPricedCart(userId);
  }

  async removeCoupon(userId: string) {
    const cart = await this.getOrCreate(userId);
    cart.couponId = null;
    await cart.save();
    return this.getPricedCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreate(userId);
    cart.items = [];
    cart.couponId = null;
    await cart.save();
  }
}
