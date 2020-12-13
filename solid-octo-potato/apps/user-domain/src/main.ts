import { NestFactory } from '@nestjs/core';
import { UserDomainModule } from './user-domain.module';

async function bootstrap() {
  const app = await NestFactory.create(UserDomainModule);
  await app.listen(4002);
}
bootstrap();
