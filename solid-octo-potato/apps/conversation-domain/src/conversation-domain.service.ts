import {
  BulkOperationType,
  Container,
  OperationInput,
  UpsertOperationInput,
  CreateOperationInput,
} from '@azure/cosmos';
import { InjectModel } from '@dinohorvat/azure-database';
import { Injectable } from '@nestjs/common';
import { PostAudience } from './models/post-audience.model';
import { Post } from './models/post.model';

@Injectable()
export class ConversationDomainService {
  constructor(
    @InjectModel(Post) private readonly postContainer: Container,
    @InjectModel(PostAudience)
    private readonly postAudienceContainer: Container,
  ) {}

  async createRoot(input: Post) {
    await this.postContainer.items.create(input);

    const authorAudience = new PostAudience();
    Object.assign(authorAudience, {
      postId: input.id,
      rootPostId: input.rootPostId,
      audienceId: input.authorUserId,
      kind: 'author',
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    });
    await this.postAudienceContainer.items.create(authorAudience);

    if (input.mentions) {
      await Promise.all(
        input.mentions
          .map((m) => ({
            postId: input.id,
            rootPostId: input.rootPostId,
            audienceId: m,
            kind: 'mention',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          }))
          .map((x) => Object.assign(new PostAudience(), x))
          .map(x => this.postAudienceContainer.items.upsert(x)),
      );
    }

    if (input.hashtags) {
      await Promise.all(
        input.hashtags
          .map((m) => ({
            postId: input.id,
            rootPostId: input.rootPostId,
            audienceId: m,
            kind: 'tag',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          }))
          .map((x) => Object.assign(new PostAudience(), x))
          .map(x => this.postAudienceContainer.items.upsert(x)),
      );
    }
  }
}
