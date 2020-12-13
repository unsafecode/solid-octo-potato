import { SharedModule } from '@app/shared';
import { AzureCosmosDbModule } from '@dinohorvat/azure-database';
import { Module } from '@nestjs/common';
import { PostCreateCommandHandler } from './commands/create-post.command-handler';
import { ConversationDomainService } from './conversation-domain.service';
import { PostAudience } from './models/post-audience.model';
import { Post } from './models/post.model';
import { MyNewsfeedQueryHandler } from './queries/my-newsfeed.query-handler';

@Module({
  imports: [
    SharedModule,
    AzureCosmosDbModule.forRoot({
      dbName: process.env.AZURE_COSMOS_DB_NAME,
      endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT,
      key: process.env.AZURE_COSMOS_DB_KEY,
    }),
    AzureCosmosDbModule.forFeature([{ dto: Post }, { dto: PostAudience }]),
  ],
  exports: [SharedModule],
  controllers: [],
  providers: [
    ConversationDomainService,
    PostCreateCommandHandler,
    MyNewsfeedQueryHandler,
  ],
})
export class ConversationDomainModule {}
