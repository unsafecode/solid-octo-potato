import { NestFactory } from '@nestjs/core';
import { ConversationDomainModule } from './conversation-domain.module';

async function bootstrap() {
  const app = await NestFactory.create(ConversationDomainModule);
  await app.init();
}
bootstrap();
