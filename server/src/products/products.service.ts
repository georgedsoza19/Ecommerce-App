import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toSlug } from '../common/utils/slug';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Product, ProductDocument } from './schemas/product.schema';

export type ProductQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  active?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  map(doc: ProductDocument | Record<string, unknown>, category?: CategoryDocument | null) {
    const d = ('toObject' in doc && typeof doc.toObject === 'function'
      ? doc.toObject()
      : doc) as Record<string, unknown>;
    const images = (d.images as Array<{ url: string; alt: string; sortOrder: number }>) ?? [];
    const rawCategory = d.categoryId as
      | Types.ObjectId
      | { _id?: Types.ObjectId }
      | string
      | null
      | undefined;
    let categoryId = '';
    if (rawCategory && typeof rawCategory === 'object' && '_id' in rawCategory && rawCategory._id) {
      categoryId = String(rawCategory._id);
    } else if (rawCategory) {
      categoryId = String(rawCategory);
    }
    return {
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      description: d.description,
      priceCents: d.priceCents,
      compareAtCents: d.compareAtCents ?? null,
      sku: d.sku,
      stock: d.stock,
      active: d.active,
      featured: d.featured,
      categoryId,
      category: category
        ? {
            id: String(category._id),
            name: category.name,
            slug: category.slug,
          }
        : undefined,
      images: [...images].sort((a, b) => a.sortOrder - b.sortOrder),
      inStock: Number(d.stock) > 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  async list(query: ProductQuery, admin = false) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(query.limit) || 12));
    const filter: Record<string, unknown> = {};

    if (!admin) filter.active = true;
    else if (query.active !== undefined) filter.active = query.active;

    if (query.q?.trim()) {
      filter.$text = { $search: query.q.trim() };
    }
    if (query.category) {
      const category = await this.categoryModel.findOne({
        slug: query.category,
      });
      if (category) filter.categoryId = category._id;
      else filter.categoryId = new Types.ObjectId('000000000000000000000000');
    }
    if (query.minPrice != null || query.maxPrice != null) {
      const price: Record<string, number> = {};
      if (query.minPrice != null) price.$gte = Number(query.minPrice);
      if (query.maxPrice != null) price.$lte = Number(query.maxPrice);
      filter.priceCents = price;
    }
    if (query.inStock) filter.stock = { $gt: 0 };
    if (query.featured) filter.featured = true;

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (query.sort) {
      case 'price_asc':
        sort = { priceCents: 1 };
        break;
      case 'price_desc':
        sort = { priceCents: -1 };
        break;
      case 'name_asc':
        sort = { name: 1 };
        break;
      case 'name_desc':
        sort = { name: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
    }

    const [total, items] = await Promise.all([
      this.productModel.countDocuments(filter),
      this.productModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categoryId'),
    ]);

    return {
      products: items.map((p) => {
        const cat = p.categoryId as unknown as CategoryDocument;
        return this.map(p, cat?._id ? cat : null);
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug, active: true })
      .populate('categoryId');
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }
    const category = product.categoryId as unknown as CategoryDocument;
    const related = await this.productModel
      .find({
        active: true,
        categoryId: product.categoryId,
        _id: { $ne: product._id },
      })
      .limit(4)
      .sort({ featured: -1, createdAt: -1 });

    return {
      product: this.map(product, category?._id ? category : null),
      related: related.map((r) => this.map(r)),
    };
  }

  async getById(id: string) {
    const product = await this.productModel.findById(id).populate('categoryId');
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }
    const category = product.categoryId as unknown as CategoryDocument;
    return { product: this.map(product, category?._id ? category : null) };
  }

  async create(data: {
    name: string;
    description: string;
    priceCents: number;
    compareAtCents?: number | null;
    sku: string;
    stock: number;
    active?: boolean;
    featured?: boolean;
    categoryId: string;
    slug?: string;
    images?: Array<{ url: string; alt?: string; sortOrder?: number }>;
  }) {
    const slug = data.slug ? toSlug(data.slug) : toSlug(data.name);
    try {
      const product = await this.productModel.create({
        name: data.name.trim(),
        slug,
        description: data.description.trim(),
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents ?? null,
        sku: data.sku.trim().toUpperCase(),
        stock: data.stock,
        active: data.active ?? true,
        featured: data.featured ?? false,
        categoryId: new Types.ObjectId(data.categoryId),
        images: (data.images ?? []).map((img, i) => ({
          url: img.url,
          alt: img.alt ?? '',
          sortOrder: img.sortOrder ?? i,
        })),
      });
      return this.getById(String(product._id));
    } catch {
      throw new ConflictException({
        code: 'PRODUCT_CONFLICT',
        message: 'SKU or slug already exists',
      });
    }
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      priceCents: number;
      compareAtCents: number | null;
      sku: string;
      stock: number;
      active: boolean;
      featured: boolean;
      categoryId: string;
      slug: string;
      images: Array<{ url: string; alt?: string; sortOrder?: number }>;
    }>,
  ) {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }
    if (data.name !== undefined) product.name = data.name.trim();
    if (data.description !== undefined)
      product.description = data.description.trim();
    if (data.priceCents !== undefined) product.priceCents = data.priceCents;
    if (data.compareAtCents !== undefined)
      product.compareAtCents = data.compareAtCents;
    if (data.sku !== undefined) product.sku = data.sku.trim().toUpperCase();
    if (data.stock !== undefined) product.stock = data.stock;
    if (data.active !== undefined) product.active = data.active;
    if (data.featured !== undefined) product.featured = data.featured;
    if (data.categoryId !== undefined)
      product.categoryId = new Types.ObjectId(data.categoryId);
    if (data.slug !== undefined) product.slug = toSlug(data.slug);
    if (data.images !== undefined) {
      product.images = data.images.map((img, i) => ({
        url: img.url,
        alt: img.alt ?? '',
        sortOrder: img.sortOrder ?? i,
      }));
    }
    try {
      await product.save();
    } catch {
      throw new ConflictException({
        code: 'PRODUCT_CONFLICT',
        message: 'SKU or slug already exists',
      });
    }
    return this.getById(id);
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }
    return { ok: true };
  }
}
