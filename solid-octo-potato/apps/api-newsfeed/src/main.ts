import { NestFactory } from '@nestjs/core';
import { ApiNewsfeedModule } from './api-newsfeed.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiNewsfeedModule);
  await app.listen(3000);
}
bootstrap();
