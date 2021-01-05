import { IEvent } from "@nestjs/cqrs";
import { PostModel } from "apps/conversation-domain/src/models/post.model";

export class PostChangedEvent implements IEvent {
  constructor(public readonly post: PostModel) {}
}
