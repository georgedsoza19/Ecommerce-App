import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toSlug } from '../common/utils/slug';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  map(doc: CategoryDocument | Record<string, unknown>) {
    const d = ('toObject' in doc && typeof doc.toObject === 'function'
      ? doc.toObject()
      : doc) as Record<string, unknown>;
    return {
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      description: d.description ?? '',
      parentId: d.parentId ? String(d.parentId) : null,
      active: d.active,
      sortOrder: d.sortOrder ?? 0,
    };
  }

  async listPublic() {
    const items = await this.categoryModel
      .find({ active: true })
      .sort({ sortOrder: 1, name: 1 });
    return { categories: items.map((c) => this.map(c)) };
  }

  async listAdmin() {
    const items = await this.categoryModel.find().sort({ sortOrder: 1, name: 1 });
    return { categories: items.map((c) => this.map(c)) };
  }

  async create(data: {
    name: string;
    description?: string;
    parentId?: string | null;
    active?: boolean;
    sortOrder?: number;
    slug?: string;
  }) {
    const slug = data.slug ? toSlug(data.slug) : toSlug(data.name);
    const exists = await this.categoryModel.findOne({ slug });
    if (exists) {
      throw new ConflictException({
        code: 'SLUG_IN_USE',
        message: 'Category slug already exists',
      });
    }
    const category = await this.categoryModel.create({
      name: data.name.trim(),
      slug,
      description: data.description?.trim() ?? '',
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
    });
    return { category: this.map(category) };
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      parentId: string | null;
      active: boolean;
      sortOrder: number;
      slug: string;
    }>,
  ) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }
    if (data.name !== undefined) category.name = data.name.trim();
    if (data.description !== undefined)
      category.description = data.description.trim();
    if (data.slug !== undefined) category.slug = toSlug(data.slug);
    if (data.parentId !== undefined) {
      category.parentId = data.parentId
        ? new Types.ObjectId(data.parentId)
        : null;
    }
    if (data.active !== undefined) category.active = data.active;
    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
    try {
      await category.save();
    } catch {
      throw new ConflictException({
        code: 'SLUG_IN_USE',
        message: 'Category slug already exists',
      });
    }
    return { category: this.map(category) };
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }
    return { ok: true };
  }

  async findBySlug(slug: string) {
    return this.categoryModel.findOne({ slug, active: true });
  }
}
