import { UserId } from "@app/models/conversation";
import { IQuery } from "@nestjs/cqrs";

export class UserGetProfileQuery implements IQuery {
    constructor(
        public readonly userId: UserId) {
        
    }
}