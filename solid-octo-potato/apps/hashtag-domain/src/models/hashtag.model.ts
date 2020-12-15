import {
    CosmosPartitionKey,
    CosmosDateTime,
    CosmosUniqueKey,
  } from '@dinohorvat/azure-database';
  
  @CosmosPartitionKey('id')
  export class Hashtag {
    @CosmosUniqueKey()
    id: string;
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