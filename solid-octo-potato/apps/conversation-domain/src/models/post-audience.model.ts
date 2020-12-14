import {
    CosmosPartitionKey,
    CosmosDateTime,
    CosmosUniqueKey,
  } from '@dinohorvat/azure-database';

@CosmosPartitionKey('audience')
export class PostAudience {
  @CosmosUniqueKey()
  get id(): string {
    return `${this.postId}_${this.audience}`;
  }
  get audience(): string {
    return `${this.kind}_${this.audienceId}`;
  }
  kind: "author" | "mention" | "tag";
  postId: string;
  rootPostId: string;
  audienceId: string;

  @CosmosDateTime() createdAt: Date;
  @CosmosDateTime() lastUpdatedAt: Date;
}