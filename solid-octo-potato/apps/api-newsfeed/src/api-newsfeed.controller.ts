import { PostCreateCommand } from '@app/models/conversation/commands/create-post.command';
import { MyNewsfeedQuery } from '@app/models/conversation/queries/my-newfeed.query';
import { Body, Controller, Get, HttpCode, Logger, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Controller("api/newsfeed")
export class ApiNewsfeedController {
  private readonly logger = new Logger(ApiNewsfeedController.name);
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("my")
  async getMyNewsfeed() {
    return await this.queryBus.execute(new MyNewsfeedQuery("foo"));
  }

  @Post("post")
  @HttpCode(202)
  async createPost(@Body() { userId, content, mentions, hashtags, attachments }) {
    this.logger.debug(this.createPost.name);
    await this.commandBus.execute(
      new PostCreateCommand(userId, content, mentions, hashtags, attachments,),
    );
  }
}
