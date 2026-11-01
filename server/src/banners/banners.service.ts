import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  map(doc: BannerDocument) {
    return {
      id: String(doc._id),
      title: doc.title,
      subtitle: doc.subtitle,
      imageUrl: doc.imageUrl,
      linkUrl: doc.linkUrl,
      placement: doc.placement,
      sortOrder: doc.sortOrder,
      active: doc.active,
    };
  }

  async listPublic(placement?: string) {
    const filter: Record<string, unknown> = { active: true };
    if (placement) filter.placement = placement;
    const banners = await this.bannerModel
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 });
    return { banners: banners.map((b) => this.map(b)) };
  }

  async listAdmin() {
    const banners = await this.bannerModel.find().sort({ sortOrder: 1 });
    return { banners: banners.map((b) => this.map(b)) };
  }

  async create(data: Partial<Banner> & { title: string; imageUrl: string }) {
    const banner = await this.bannerModel.create(data);
    return { banner: this.map(banner) };
  }

  async update(id: string, data: Partial<Banner>) {
    const banner = await this.bannerModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!banner) {
      throw new NotFoundException({
        code: 'BANNER_NOT_FOUND',
        message: 'Banner not found',
      });
    }
    return { banner: this.map(banner) };
  }

  async remove(id: string) {
    const banner = await this.bannerModel.findByIdAndDelete(id);
    if (!banner) {
      throw new NotFoundException({
        code: 'BANNER_NOT_FOUND',
        message: 'Banner not found',
      });
    }
    return { ok: true };
  }
}
