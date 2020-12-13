import { PostCreateCommand } from '@app/models/conversation/commands/create-post.command';
import { UserMentionedEvent } from '@app/models/conversation/events/user-mentioned.event';
import { Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConversationDomainService } from '../conversation-domain.service';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(PostCreateCommand)
export class PostCreateCommandHandler
  implements ICommandHandler<PostCreateCommand> {
  private readonly logger = new Logger(PostCreateCommandHandler.name);
  constructor(
    private readonly svc: ConversationDomainService,
    private readonly events: EventBus,
  ) {}
  async execute(command: PostCreateCommand): Promise<any> {
    this.logger.debug(`Handling new post '${command.content}'`);
    const newPostId = uuidv4();
    await this.svc.createRoot({
        authorUserId: command.userId,
        content: command.content,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        id: newPostId,
        rootPostId: newPostId,
        geo: null,
        hashtags: command.hashtags,
        mentions: command.hashtags,
        attachments: command.attachments
    });

    if (command.mentions) {
      await Promise.all(
        command.mentions.map((m) =>
          this.events.publish(new UserMentionedEvent(m, newPostId)),
        ),
      );
    }
  }
}
