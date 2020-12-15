import {
  CosmosPartitionKey,
  CosmosDateTime,
  CosmosUniqueKey,
} from '@dinohorvat/azure-database';

@CosmosPartitionKey('id')
export class UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  @CosmosUniqueKey()
  displayName: string;
  email: string;
  @CosmosUniqueKey()
  upn: string;
  aboutMe: string;
  followedUsers: string[];
  followedTags: string[];

  @CosmosDateTime() createdAt: Date;
  @CosmosDateTime() lastUpdatedAt: Date;
}
