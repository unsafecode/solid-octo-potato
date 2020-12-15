import { HashtagId } from "@app/models/conversation";

export class HashtagGetProfileQuery {
    constructor(public readonly hashtagId: HashtagId) {
        
    }
}