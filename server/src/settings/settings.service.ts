import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StoreSetting,
  StoreSettingDocument,
} from './schemas/store-setting.schema';

export type UpdateSettingsDto = Partial<{
  storeName: string;
  supportEmail: string;
  currency: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  taxRateBps: number;
  lowStockThreshold: number;
}>;

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(StoreSetting.name)
    private settingsModel: Model<StoreSettingDocument>,
  ) {}

  async getOrCreate(): Promise<StoreSettingDocument> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create({});
    }
    return settings;
  }

  map(doc: StoreSettingDocument) {
    return {
      id: String(doc._id),
      storeName: doc.storeName,
      supportEmail: doc.supportEmail,
      currency: doc.currency,
      flatShippingCents: doc.flatShippingCents,
      freeShippingThresholdCents: doc.freeShippingThresholdCents,
      taxRateBps: doc.taxRateBps,
      lowStockThreshold: doc.lowStockThreshold,
    };
  }

  async getPublic() {
    const settings = await this.getOrCreate();
    return {
      settings: {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        currency: settings.currency,
        flatShippingCents: settings.flatShippingCents,
        freeShippingThresholdCents: settings.freeShippingThresholdCents,
        taxRateBps: settings.taxRateBps,
      },
    };
  }

  async getAdmin() {
    return { settings: this.map(await this.getOrCreate()) };
  }

  async update(dto: UpdateSettingsDto) {
    const settings = await this.getOrCreate();
    Object.assign(settings, dto);
    await settings.save();
    return { settings: this.map(settings) };
  }
}
