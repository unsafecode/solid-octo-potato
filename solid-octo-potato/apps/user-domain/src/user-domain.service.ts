import { Container } from '@azure/cosmos';
import { InjectModel } from '@dinohorvat/azure-database';
import { Injectable, Logger } from '@nestjs/common';
import { UserProfile } from './models/user.model';

@Injectable()
export class UserDomainService {
  private readonly logger = new Logger(UserDomainService.name);
  constructor(
    @InjectModel(UserProfile) private readonly userContainer: Container,
  ) {}

  async create(profile: UserProfile) {
    // In future, fill in defaults
    profile.followedTags = profile.followedTags ?? [];
    profile.followedUsers = profile.followedUsers ?? [];

    const result = await this.userContainer.items.create(profile);

    return result.resource.id;
  }
  async getProfile(userId: string): Promise<UserProfile> {
    const result = await this.userContainer
      .item(userId, userId)
      .read<UserProfile>();
    return result.resource;
  }

  async getInterests(userId: string) {
    const result = await this.userContainer.items
      .query({
        query:
          'SELECT TOP 1 followedTags, followedUsers FROM c WHERE c.id = @id',
        parameters: [{ name: 'id', value: userId }],
      })
      .fetchAll();
    const [item, ...rest] = result.resources;
    return item;
  }
}
