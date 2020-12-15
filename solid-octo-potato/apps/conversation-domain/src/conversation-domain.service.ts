import { HashtagId, UserId } from "@app/models/conversation";
import { Container } from "@azure/cosmos";
import { InjectModel } from "@dinohorvat/azure-database";
import { Injectable, Logger } from "@nestjs/common";
import { PostAudience } from "./models/post-audience.model";
import { PostModel } from "./models/post.model";
import * as _ from "lodash";

@Injectable()
export class ConversationDomainService {
  private readonly logger = new Logger(ConversationDomainService.name);
  constructor(
    @InjectModel(PostModel) private readonly postContainer: Container,
    @InjectModel(PostAudience)
    private readonly postAudienceContainer: Container,
  ) {}

  async createRoot(input: PostModel) {
    await this.postContainer.items.create(input);

    this.logger.debug("Creating audiences");
    const authorAudience = new PostAudience();
    Object.assign(authorAudience, {
      postId: input.id,
      rootPostId: input.rootPostId,
      audienceId: input.authorUserId,
      kind: "author",
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
            kind: "mention",
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          }))
          .map((x) => Object.assign(new PostAudience(), x))
          .map((x) => this.postAudienceContainer.items.upsert(x)),
      );
    }

    if (input.hashtags) {
      await Promise.all(
        input.hashtags
          .map((m) => ({
            postId: input.id,
            rootPostId: input.rootPostId,
            audienceId: m,
            kind: "tag",
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          }))
          .map((x) => Object.assign(new PostAudience(), x))
          .map((x) => this.postAudienceContainer.items.upsert(x)),
      );
    }
  }

  async getNewsfeed(users: UserId[], hashtags: HashtagId[]) {
    const ids = [
      ..._.uniq(users).map((u) => `author_${u}`),
      ..._.uniq(users).map((u) => `mention_${u}`),
      ..._.uniq(hashtags).map((u) => `tag_${u}`),
    ]
      .map((x) => `'${x}'`)
      .join(",");
    const { resources: conversationsIds } = await this.postAudienceContainer.items
      .query<string>({
        query: `SELECT DISTINCT c.rootPostId FROM c WHERE audience IN (${ids}) ORDER BY c.lastUpdatedAt DESC`,
      })
      .fetchAll();

    const list = conversationsIds.map((x) => `'${x}'`).join(",");
    const { resources: conversations } = await this.postContainer.items
      .query({
        query: `SELECT * from c WHERE c.rootPostId IN (${list})`,
      })
      .fetchAll();

    return conversations;
  }
}
