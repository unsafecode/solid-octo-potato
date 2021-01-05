import { IQuery } from "@nestjs/cqrs";

export class UserGetInfo implements IQuery {
    constructor(public readonly upn: string) {
        
    }
}