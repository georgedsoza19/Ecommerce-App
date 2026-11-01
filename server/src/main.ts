import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import cookieParser from 'cookie-parser';
import { existsSync } from 'fs';
import helmet from 'helmet';
import { Model } from 'mongoose';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { runSeed } from './seed/run-seed';
import { User, UserDocument } from './users/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';

  // Free Render has no Shell — seed empty databases on boot when enabled.
  if (config.get('SEED_ON_BOOT') === 'true') {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const count = await userModel.countDocuments();
    if (count === 0) {
      console.log('SEED_ON_BOOT: empty database — loading demo data…');
      await runSeed(app, { wipe: true });
    } else {
      console.log(`SEED_ON_BOOT: skipped (${count} users already present)`);
    }
  }

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // SPA assets are same-origin; allow inline styles from Vite CSS.
      contentSecurityPolicy: isProd ? false : undefined,
    }),
  );
  app.use(cookieParser());
  const clientOrigin =
    config.get<string>('CLIENT_ORIGIN') ||
    config.get<string>('RENDER_EXTERNAL_URL') ||
    'http://localhost:5173';
  app.enableCors({
    origin: clientOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const uploadDir = config.get('UPLOAD_DIR', 'uploads');
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads' });

  // Production demo: serve the Vite build from the same origin as the API
  // so httpOnly auth cookies work without cross-site setup.
  const clientDist =
    config.get<string>('CLIENT_DIST') || join(process.cwd(), 'public');
  if (existsSync(clientDist)) {
    app.useStaticAssets(clientDist, { index: false });
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)).*/, (_req, res) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  const port = Number(config.get('PORT', 3000));
  await app.listen(port);
  console.log(`Geo API listening on http://localhost:${port}/api`);
}

bootstrap();
