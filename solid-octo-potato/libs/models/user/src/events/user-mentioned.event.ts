import { UserId } from "@app/models/conversation";

export class UserMentionedEvent {
    constructor(public readonly userId: UserId, public readonly postId: string) {
        
    }
}