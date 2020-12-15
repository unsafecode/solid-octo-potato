import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';

@Module({
  imports: [SharedModule],
  controllers: [ApiUserController],
  providers: [],
})
export class ApiUserModule {}
