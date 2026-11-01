import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddressDto } from './dto/address.dto';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  private map(doc: AddressDocument) {
    return {
      id: String(doc._id),
      fullName: doc.fullName,
      line1: doc.line1,
      line2: doc.line2,
      city: doc.city,
      region: doc.region,
      postalCode: doc.postalCode,
      country: doc.country,
      phone: doc.phone,
      isDefault: doc.isDefault,
    };
  }

  async list(userId: string) {
    const items = await this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 });
    return { addresses: items.map((a) => this.map(a)) };
  }

  async create(userId: string, dto: AddressDto) {
    const count = await this.addressModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
    const isDefault = dto.isDefault ?? count === 0;
    if (isDefault) {
      await this.addressModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false },
      );
    }
    const address = await this.addressModel.create({
      userId: new Types.ObjectId(userId),
      fullName: dto.fullName.trim(),
      line1: dto.line1.trim(),
      line2: dto.line2?.trim() ?? '',
      city: dto.city.trim(),
      region: dto.region.trim(),
      postalCode: dto.postalCode.trim(),
      country: (dto.country ?? 'US').trim().toUpperCase(),
      phone: dto.phone?.trim() ?? '',
      isDefault,
    });
    return { address: this.map(address) };
  }

  async update(userId: string, id: string, dto: AddressDto) {
    const address = await this.addressModel.findById(id);
    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }
    if (String(address.userId) !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You cannot modify this address',
      });
    }
    if (dto.isDefault) {
      await this.addressModel.updateMany(
        { userId: address.userId },
        { isDefault: false },
      );
    }
    Object.assign(address, {
      fullName: dto.fullName.trim(),
      line1: dto.line1.trim(),
      line2: dto.line2?.trim() ?? '',
      city: dto.city.trim(),
      region: dto.region.trim(),
      postalCode: dto.postalCode.trim(),
      country: (dto.country ?? address.country).trim().toUpperCase(),
      phone: dto.phone?.trim() ?? '',
      isDefault: dto.isDefault ?? address.isDefault,
    });
    await address.save();
    return { address: this.map(address) };
  }

  async remove(userId: string, id: string) {
    const address = await this.addressModel.findById(id);
    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }
    if (String(address.userId) !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You cannot delete this address',
      });
    }
    const wasDefault = address.isDefault;
    await address.deleteOne();
    if (wasDefault) {
      const next = await this.addressModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    return { ok: true };
  }

  async getOwned(userId: string, id: string) {
    const address = await this.addressModel.findById(id);
    if (!address || String(address.userId) !== userId) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found',
      });
    }
    return address;
  }
}
