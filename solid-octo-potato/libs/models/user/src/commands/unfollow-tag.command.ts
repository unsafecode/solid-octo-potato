import { HashtagId, UserId } from "@app/models/conversation";

export class UserUnFollowTagCommand {
    constructor(
        public readonly userId: UserId,
        public readonly hashtagId: HashtagId,
    ) {
        
    }
}