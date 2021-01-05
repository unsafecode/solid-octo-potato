import { HashtagId, UserId } from "@app/models/conversation";
import { PostCreateCommand } from "@app/models/conversation/commands/create-post.command";
import { NewsfeedQuery } from "@app/models/conversation/queries/newfeed.query";
import { ResolveHashtagsCommand } from "@app/models/hashtag/commands/resolve-hashtags.command";
import { UserGetInterestsQuery } from "@app/models/user";
import { ResolveMentionsQuery } from "@app/models/user/queries/resolve-mentions.query";
import { Body, Controller, Get, HttpCode, Logger, Post, Req, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AuthGuard } from "@nestjs/passport";
import { PostModel } from "apps/conversation-domain/src/models/post.model";

@UseGuards(AuthGuard("azure-ad"))
@Controller("api/newsfeed")
export class ApiNewsfeedController {
  private readonly logger = new Logger(ApiNewsfeedController.name);
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  async getMyNewsfeed(@Req() req) {
    const userId = req.user.id;
    const { followedUsers, followedTags } = await this.queryBus.execute(new UserGetInterestsQuery(userId));
    const conversations: PostModel[] = await this.queryBus.execute<NewsfeedQuery>(
      new NewsfeedQuery(followedUsers, followedTags),
    );

    return conversations;
  }

  @Post()
  async createPost(@Req() req, @Body() { content, mentions, hashtags, attachments }) {
    const userId = req.user.id;

    const resolvedHashtagsIds: HashtagId[] = await this.commandBus.execute(new ResolveHashtagsCommand(hashtags));
    const resolvedUsersIds: UserId[] = await this.queryBus.execute(new ResolveMentionsQuery(mentions));

    return await this.commandBus.execute(
      new PostCreateCommand(userId, content, resolvedUsersIds, resolvedHashtagsIds, attachments),
    );
  }
}
