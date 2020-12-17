import { SharedModule } from '@app/shared';
import { AzureCosmosDbModule } from '@dinohorvat/azure-database';
import { Module } from '@nestjs/common';
import { PostCreateCommandHandler } from './commands/create-post.handler';
import { PostAudience } from './models/post-audience.model';
import { PostModel } from './models/post.model';
import { MyNewsfeedQueryHandler } from './queries/newsfeed.handler';

@Module({
  imports: [
    SharedModule,
    AzureCosmosDbModule.forRoot({
      dbName: process.env.AZURE_COSMOS_DB_NAME,
      endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT,
      key: process.env.AZURE_COSMOS_DB_KEY,
    }),
    AzureCosmosDbModule.forFeature([{ dto: PostModel, collection: "posts" }, { dto: PostAudience, collection: "post-audiences" }]),
  ],
  exports: [SharedModule],
  controllers: [],
  providers: [
    PostCreateCommandHandler,
    MyNewsfeedQueryHandler,
  ],
})
export class ConversationDomainModule {}
