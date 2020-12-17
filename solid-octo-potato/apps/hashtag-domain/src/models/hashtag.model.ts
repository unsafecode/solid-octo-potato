import {
    CosmosPartitionKey,
    CosmosDateTime,
    CosmosUniqueKey,
  } from '@dinohorvat/azure-database';
  
  @CosmosPartitionKey('id')
  export class Hashtag {
    id: string;
    @CosmosUniqueKey()
    hashtag: string;
    name: string;
    description: string;
    type: HashtagType;
  
    @CosmosDateTime() createdAt: Date;
    @CosmosDateTime() lastUpdatedAt: Date;
  }
  
  export enum HashtagType {
    Generic
  }