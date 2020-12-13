import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ConversationDomainModule } from './conversation-domain.module';

async function bootstrap() {
  const app = await NestFactory.create(ConversationDomainModule);
  app.connectMicroservice({
    transport: Transport.TCP,
  });
  await app.listen(4001);
}
bootstrap();
