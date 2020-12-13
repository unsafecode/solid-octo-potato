import { SharedModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { UserMentionedEventHandler } from './events/user-mentioned.event-handler';
import { UserDomainService } from './user-domain.service';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [UserDomainService, UserMentionedEventHandler],
})
export class UserDomainModule {}
