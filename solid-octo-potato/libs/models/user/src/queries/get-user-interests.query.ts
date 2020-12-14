import { UserId } from "@app/models/conversation";

export class UserGetInterestsQuery {
    constructor(
        public readonly userId: UserId
    ) {
        
    }
}