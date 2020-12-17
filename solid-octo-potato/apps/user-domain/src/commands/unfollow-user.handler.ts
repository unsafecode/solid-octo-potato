import { UserUnFollowUserCommand } from "@app/models/user";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserDomainService } from "../user-domain.service";

@CommandHandler(UserUnFollowUserCommand)
export class UserUnFollowUserCommandHandler implements ICommandHandler<UserUnFollowUserCommand> {
    /**
     *
     */
    constructor(
        private readonly svc: UserDomainService
    ) {
        
    }
    async execute(command: UserUnFollowUserCommand): Promise<void> {
        const profile = await this.svc.getProfile(command.sourceUserId);
        profile.followedUsers = profile.followedUsers.filter(x => x !== command.targetUserId);
        await this.svc.updateProfile(profile);
    }

}