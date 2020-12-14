import { UserId } from "@app/models/conversation";

export class UserGetProfileQuery {
    constructor(
        public readonly userId: UserId) {
        
    }
}