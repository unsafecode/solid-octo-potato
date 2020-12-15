import { SharedModule } from "@app/shared";
import { AzureCosmosDbModule } from "@dinohorvat/azure-database";
import { Module } from "@nestjs/common";
import { ResolveHashtagsCommandHandler } from "./commands/resolve-hashtags.handler";
import { Hashtag } from "./models/hashtag.model";

@Module({
  imports: [
    SharedModule,
    AzureCosmosDbModule.forRoot({
      dbName: process.env.AZURE_COSMOS_DB_NAME,
      endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT,
      key: process.env.AZURE_COSMOS_DB_KEY,
    }),
    AzureCosmosDbModule.forFeature([{ dto: Hashtag }]),
  ],
  controllers: [],
  providers: [ResolveHashtagsCommandHandler],
})
export class HashtagDomainModule {}
