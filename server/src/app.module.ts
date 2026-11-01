import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AddressesModule } from './addresses/addresses.module';
import { AuthModule } from './auth/auth.module';
import { BannersModule } from './banners/banners.module';
import { CategoriesModule } from './categories/categories.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        const secret = config.get<string>('JWT_SECRET');
        if (!uri) throw new Error('MONGODB_URI is required');
        if (!secret || secret.length < 16) {
          throw new Error('JWT_SECRET must be set (min 16 characters)');
        }
        return { uri };
      },
    }),
    AuthModule,
    UsersModule,
    AddressesModule,
    CategoriesModule,
    ProductsModule,
    BannersModule,
    SettingsModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
