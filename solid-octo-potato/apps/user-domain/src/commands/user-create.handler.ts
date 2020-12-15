import { UserCreateCommand } from '@app/models/user/commands/create-user.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserProfile } from '../models/user.model';
import { UserDomainService } from '../user-domain.service';

@CommandHandler(UserCreateCommand)
export class UserCreateCommandHandler
  implements ICommandHandler<UserCreateCommand> {
  constructor(
    private readonly svc: UserDomainService
  ) {}
  async execute(command: UserCreateCommand): Promise<any> {
    const profile = new UserProfile();
    Object.assign(profile, command);
    return await this.svc.create(profile);
  }
}
