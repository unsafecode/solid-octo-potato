import { UserInfo } from '@app/models/user/dto/user-info.dto';
import { UserGetInfo as UserGetInfoQuery } from '@app/models/user/queries/get-user-info.query';
import { Container } from '@azure/cosmos';
import { InjectModel } from '@dinohorvat/azure-database';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserProfile } from '../models/user.model';

@QueryHandler(UserGetInfoQuery)
export class UserGetInfoQueryHandler
  implements IQueryHandler<UserGetInfoQuery> {
  constructor(@InjectModel(UserProfile) private readonly userContainer: Container) {}
  async execute(query: UserGetInfoQuery): Promise<UserInfo> {
    const { resources: [result] } = await this.userContainer.items.query<UserInfo>({
        query: `SELECT TOP 1 c.id, c.displayName, c.upn FROM c WHERE c.upn = '${query.upn}'`
    }).fetchAll();
    
    return result;
  }
}
