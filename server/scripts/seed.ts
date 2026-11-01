import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { runSeed } from '../src/seed/run-seed';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await runSeed(app, { wipe: true });
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
