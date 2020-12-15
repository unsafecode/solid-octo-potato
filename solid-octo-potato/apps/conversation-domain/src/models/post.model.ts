import { UserId } from '@app/models/conversation';
import {
    CosmosPartitionKey,
    CosmosDateTime,
    CosmosUniqueKey,
    Point,
  } from '@dinohorvat/azure-database';

@CosmosPartitionKey('rootPostId')
export class PostModel {
  @CosmosUniqueKey()
  id: string;
  rootPostId: string;
  authorUserId: UserId;
  content: string;
  mentions: string[];
  hashtags: string[];
  attachments: any[];
  geo: Point;

  @CosmosDateTime() createdAt: Date;
  @CosmosDateTime() lastUpdatedAt: Date;
}