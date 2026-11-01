import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StoreSetting,
  StoreSettingSchema,
} from './schemas/store-setting.schema';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreSetting.name, schema: StoreSettingSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
