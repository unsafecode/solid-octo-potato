import { UserGetInterestsQuery, UserGetProfileQuery } from '@app/models/user';
import { SharedModule } from '@app/shared';
import { AzureCosmosDbModule } from '@dinohorvat/azure-database';
import { Module } from '@nestjs/common';
import { UserFollowTagCommandHandler } from './commands/follow-tag.handler';
import { UserFollowUserCommandHandler } from './commands/follow-user.handler';
import { UserUnFollowTagCommandHandler } from './commands/unfollow-tag.handler';
import { UserUnFollowUserCommandHandler } from './commands/unfollow-user.handler';
import { UserCreateCommandHandler } from './commands/user-create.handler';
import { UserMentionedEventHandler } from './events/user-mentioned.handler';
import { UserProfile } from './models/user.model';
import { UserGetInfoQueryHandler } from './queries/get-user-info.handler';
import { ResolveMentionsQueryHandler } from './queries/resolve-mentions.handler';
import { UserGetInterestsQueryHandler } from './queries/user-getinterests.handler';
import { UserGetProfileQueryHandler } from './queries/user-getprofile.handler';
import { UserDomainService } from './user-domain.service';

@Module({
  imports: [
    SharedModule,
    AzureCosmosDbModule.forRoot({
      dbName: process.env.AZURE_COSMOS_DB_NAME,
      endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT,
      key: process.env.AZURE_COSMOS_DB_KEY,
    }),
    AzureCosmosDbModule.forFeature([{ dto: UserProfile }]),
  ],
  controllers: [],
  providers: [
    UserDomainService,
    UserMentionedEventHandler,
    UserCreateCommandHandler,
    UserFollowUserCommandHandler,
    UserFollowTagCommandHandler,
    UserUnFollowTagCommandHandler,
    UserUnFollowUserCommandHandler,
    UserGetProfileQueryHandler,
    UserGetInfoQueryHandler,
    UserGetInterestsQueryHandler,
    ResolveMentionsQueryHandler
  ],
})
export class UserDomainModule {}
