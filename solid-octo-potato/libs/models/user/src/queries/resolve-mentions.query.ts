import { ICommand } from "@nestjs/cqrs";

export class ResolveMentionsQuery implements ICommand {
    constructor(public readonly names: string[]) {
        
    }
}