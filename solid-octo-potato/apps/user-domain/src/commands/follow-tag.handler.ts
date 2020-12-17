import { UserFollowTagCommand } from "@app/models/user";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserDomainService } from "../user-domain.service";

@CommandHandler(UserFollowTagCommand)
export class UserFollowTagCommandHandler implements ICommandHandler<UserFollowTagCommand> {
  /**
   *
   */
  constructor(private readonly svc: UserDomainService) {}
  async execute(command: UserFollowTagCommand): Promise<void> {
    const profile = await this.svc.getProfile(command.userId);
    profile.followedTags = [...profile.followedTags.filter((x) => x !== command.hashtagId), command.hashtagId];
    await this.svc.updateProfile(profile);
  }
}
