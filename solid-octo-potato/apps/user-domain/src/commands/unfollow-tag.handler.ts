import { UserUnFollowTagCommand } from "@app/models/user";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserDomainService } from "../user-domain.service";

@CommandHandler(UserUnFollowTagCommand)
export class UserUnFollowTagCommandHandler implements ICommandHandler<UserUnFollowTagCommand> {
    /**
     *
     */
    constructor(
        private readonly svc: UserDomainService
    ) {
        
    }
    async execute(command: UserUnFollowTagCommand): Promise<void> {
        const profile = await this.svc.getProfile(command.userId);
        profile.followedTags = profile.followedTags.filter(x => x !== command.hashtagId);
        await this.svc.updateProfile(profile);
    }

}