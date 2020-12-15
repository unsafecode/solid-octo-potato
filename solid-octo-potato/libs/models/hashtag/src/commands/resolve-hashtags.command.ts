import { ICommand } from "@nestjs/cqrs";

export class ResolveHashtagsCommand implements ICommand {
    constructor(public readonly names: string[]) {
        
    }
}