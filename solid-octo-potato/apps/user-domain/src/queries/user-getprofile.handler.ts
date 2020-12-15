import { UserGetProfileQuery } from '@app/models/user';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserProfile } from '../models/user.model';
import { UserDomainService } from '../user-domain.service';

@QueryHandler(UserGetProfileQuery)
export class UserGetProfileQueryHandler
  implements IQueryHandler<UserGetProfileQuery> {
  constructor(private readonly svc: UserDomainService) {}
  async execute(query: UserGetProfileQuery): Promise<UserProfile> {
    return await this.svc.getProfile(query.userId);
  }
}
