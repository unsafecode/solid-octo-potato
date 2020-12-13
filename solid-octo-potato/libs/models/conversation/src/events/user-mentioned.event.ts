import { UserId } from "../types";

export class UserMentionedEvent {
    constructor(public readonly userId: UserId, public readonly postId: string) {
        
    }
}