import { HashtagId, UserId } from "@app/models/conversation";
import { PostCreateCommand } from "@app/models/conversation/commands/create-post.command";
import { NewsfeedQuery } from "@app/models/conversation/queries/newfeed.query";
import { ResolveHashtagsCommand } from "@app/models/hashtag/commands/resolve-hashtags.command";
import { UserGetInterestsQuery } from "@app/models/user";
import { ResolveMentionsQuery } from "@app/models/user/queries/resolve-mentions.query";
import { Body, Controller, Get, HttpCode, Logger, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { PostModel } from "apps/conversation-domain/src/models/post.model";
import { Hashtag } from "apps/hashtag-domain/src/models/hashtag.model";

@Controller("api/newsfeed")
export class ApiNewsfeedController {
  private readonly logger = new Logger(ApiNewsfeedController.name);
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  async getMyNewsfeed() {
    const userId = "cbef4451-2595-401f-af51-6272936d9f9c";
    const { users, hashtags } = await this.queryBus.execute(new UserGetInterestsQuery(userId));
    const conversations: PostModel[] = await this.queryBus.execute<NewsfeedQuery>(new NewsfeedQuery(users, hashtags));

    return conversations;
  }

  @Post("post")
  async createPost(@Body() { userId, content, mentions, hashtags, attachments }) {
    const resolvedHashtagsIds: HashtagId[] = await this.commandBus.execute(new ResolveHashtagsCommand(hashtags));
    const resolvedUsersIds: UserId[] = await this.queryBus.execute(new ResolveMentionsQuery(mentions));

    return await this.commandBus.execute(
      new PostCreateCommand(userId, content, resolvedUsersIds, resolvedHashtagsIds, attachments),
    );
  }
}
