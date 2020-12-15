import { NestFactory } from '@nestjs/core';
import { HashtagDomainModule } from './hashtag-domain.module';

async function bootstrap() {
  const app = await NestFactory.create(HashtagDomainModule);
  await app.init();
}
bootstrap();
