import { ICommand } from "@nestjs/cqrs";
import { HashtagId, PostAttachment, PostContent, UserId } from "../types";

export class PostCreateCommand implements ICommand {
    constructor(
        public readonly userId: UserId,
        public readonly content: PostContent,
        public readonly mentions: UserId[],
        public readonly hashtags: HashtagId[],
        public readonly attachments: PostAttachment[],
    ) {
        
    }
}