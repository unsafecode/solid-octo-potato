import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';

@Module({
  imports: [],
  controllers: [ApiUserController],
  providers: [],
})
export class ApiUserModule {}
