import { HashtagId, UserId } from "@app/models/conversation";

export class UserUnFollowUserCommand {
    constructor(
        public readonly sourceUserId: UserId,
        public readonly targetUserId: UserId,
    ) {
        
    }
}