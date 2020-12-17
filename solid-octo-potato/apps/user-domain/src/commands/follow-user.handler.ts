import { UserFollowUserCommand } from "@app/models/user";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserDomainService } from "../user-domain.service";

@CommandHandler(UserFollowUserCommand)
export class UserFollowUserCommandHandler implements ICommandHandler<UserFollowUserCommand> {
  /**
   *
   */
  constructor(private readonly svc: UserDomainService) {}
  async execute(command: UserFollowUserCommand): Promise<void> {
    const profile = await this.svc.getProfile(command.sourceUserId);
    profile.followedUsers = [...profile.followedUsers.filter((x) => x !== command.targetUserId), command.targetUserId];
    await this.svc.updateProfile(profile);
  }
}
