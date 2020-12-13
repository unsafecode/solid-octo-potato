import {
    CosmosPartitionKey,
    CosmosDateTime,
    CosmosUniqueKey,
  } from '@dinohorvat/azure-database';

@CosmosPartitionKey('rootPostId')
export class PostAudience {
  @CosmosUniqueKey()
  get id(): string {
    return `${this.rootPostId}_${this.kind}_${this.audienceId}`;
  }
  kind: "author" | "mention" | "tag";
  rootPostId: string;
  audienceId: string;

  @CosmosDateTime() createdAt: Date;
  @CosmosDateTime() lastUpdatedAt: Date;
}