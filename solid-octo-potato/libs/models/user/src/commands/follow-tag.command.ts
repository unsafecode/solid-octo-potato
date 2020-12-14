import { HashtagId, UserId } from "@app/models/conversation";

export class UserFollowTagCommand {
    constructor(
        public readonly userId: UserId,
        public readonly hashtagId: HashtagId,
    ) {
        
    }
}