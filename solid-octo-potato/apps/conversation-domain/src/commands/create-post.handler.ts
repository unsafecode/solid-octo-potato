import { PostCreateCommand } from "@app/models/conversation/commands/create-post.command";
import { Logger } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { v4 as uuidv4 } from "uuid";
import { Container } from "@azure/cosmos";
import { InjectModel } from "@dinohorvat/azure-database";
import { PostAudience } from "../models/post-audience.model";
import { PostModel } from "../models/post.model";
import { UserMentionedEvent } from "@app/models/user";

@CommandHandler(PostCreateCommand)
export class PostCreateCommandHandler implements ICommandHandler<PostCreateCommand> {
  private readonly logger = new Logger(PostCreateCommandHandler.name);

  constructor(
    @InjectModel(PostModel) private readonly postContainer: Container,
    @InjectModel(PostAudience)
    private readonly postAudienceContainer: Container,
    private readonly events: EventBus,
  ) {}
  async execute(command: PostCreateCommand): Promise<string> {
    this.logger.debug(`Handling new post '${command.content}'`);
    const newPostId = uuidv4();

    await this.createPost(newPostId, command);

    await this.createAudiences(newPostId, command);

    await this.emitEvents(command, newPostId);

    return newPostId;
  }

  private async createPost(newPostId: any, command: PostCreateCommand) {
    const post = new PostModel();
    post.rootPostId = newPostId;
    post.id = newPostId;
    Object.assign(post, command);

    await this.postContainer.items.create(post);
  }

  private async emitEvents(command: PostCreateCommand, newPostId: any) {
    if (command.mentions) {
      await Promise.all(command.mentions.map((m) => this.events.publish(new UserMentionedEvent(m, newPostId))));
    }
  }

  private async createAudiences(newPostId: string, command: PostCreateCommand) {
    this.logger.debug("Creating audiences");
    const authorAudience = new PostAudience();
    Object.assign(authorAudience, {
      postId: newPostId,
      rootPostId: newPostId,
      audienceId: command.userId,
      kind: "author",
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    });

    this.logger.debug(`Creating ${JSON.stringify(authorAudience)}`);
    await this.postAudienceContainer.items.upsert(authorAudience);

    this.logger.debug(`Creating mentions`);
    if (command.mentions) {
      await Promise.all(
        command.mentions
          .map((m) => ({
            postId: newPostId,
            rootPostId: newPostId,
            audienceId: m,
            kind: "mention",
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          }))
          .map((x) => Object.assign(new PostAudience(), x))
          .map(async (x) => {
            this.logger.debug(x.id);
            await this.postAudienceContainer.items.upsert(x);
          }),
      );
    }
    this.logger.debug(`Creating hashtags`);

    if (command.hashtags) {
      await Promise.all(
        command.hashtags
          .map((m) => ({
            postId: newPostId,
            rootPostId: newPostId,
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
}
