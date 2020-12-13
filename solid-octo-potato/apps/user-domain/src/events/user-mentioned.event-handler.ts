import { UserMentionedEvent } from "@app/models/conversation/events/user-mentioned.event";
import { Logger } from "@nestjs/common";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";

@EventsHandler(UserMentionedEvent)
export class UserMentionedEventHandler implements IEventHandler<UserMentionedEvent> {
    private readonly logger = new Logger(UserMentionedEventHandler.name);
    constructor() {
        
    }
    handle(event: UserMentionedEvent) {
        this.logger.debug(`userId: ${event.userId}, postId: ${event.postId}`);
    }
}