import { NewsfeedQuery } from "@app/models/conversation/queries/newfeed.query";
import { Container } from "@azure/cosmos";
import { InjectModel } from "@dinohorvat/azure-database";
import { Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import * as _ from "lodash";
import { PostAudience } from "../models/post-audience.model";
import { PostModel } from "../models/post.model";

@QueryHandler(NewsfeedQuery)
export class MyNewsfeedQueryHandler implements IQueryHandler<NewsfeedQuery> {
  private readonly logger = new Logger(MyNewsfeedQueryHandler.name);
  constructor(
    @InjectModel(PostModel) private readonly postContainer: Container,
    @InjectModel(PostAudience)
    private readonly postAudienceContainer: Container,
  ) {}
  async execute({ hashtags, users }: NewsfeedQuery): Promise<string[]> {
    this.logger.debug("execute");
    const ids = [
      ..._.uniq(users).map((u) => `author_${u}`),
      ..._.uniq(users).map((u) => `mention_${u}`),
      ..._.uniq(hashtags).map((u) => `tag_${u}`),
    ]
      .map((x) => `'${x}'`)
      .join(",");
    const audienceQuery = `SELECT DISTINCT VALUE c.rootPostId FROM c WHERE c.audience IN (${ids}) ORDER BY c.lastUpdatedAt DESC`;
    this.logger.debug(audienceQuery);
    const { resources: conversationsIds } = await this.postAudienceContainer.items
      .query<string>({
        query: audienceQuery,
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
