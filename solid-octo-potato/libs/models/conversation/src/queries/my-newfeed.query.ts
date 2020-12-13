import { UserId } from "../types";

export class MyNewsfeedQuery {
    constructor(public readonly userId: UserId) {
    }
}