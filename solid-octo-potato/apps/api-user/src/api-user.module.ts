import { ApiCommonsModule } from '@app/api-commons';
import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';

@Module({
  imports: [SharedModule, ApiCommonsModule],
  controllers: [ApiUserController],
  providers: [],
})
export class ApiUserModule {}
