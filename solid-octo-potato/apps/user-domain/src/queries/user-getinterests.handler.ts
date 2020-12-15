import { UserGetInterestsQuery, UserGetProfileQuery } from '@app/models/user';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserProfile } from '../models/user.model';
import { UserDomainService } from '../user-domain.service';

@QueryHandler(UserGetInterestsQuery)
export class UserGetInterestsQueryHandler
  implements IQueryHandler<UserGetInterestsQuery> {
  constructor(private readonly svc: UserDomainService) {}
  async execute(query: UserGetInterestsQuery): Promise<UserProfile> {
    return await this.svc.getInterests(query.userId);
  }
}
