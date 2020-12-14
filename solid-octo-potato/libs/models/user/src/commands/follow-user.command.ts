import { HashtagId, UserId } from "@app/models/conversation";

export class UserFollowUserCommand {
    constructor(
        public readonly sourceUserId: UserId,
        public readonly targetUserId: UserId,
    ) {
        
    }
}