import { UserId } from "@app/models/conversation";
import { ResolveMentionsQuery } from "@app/models/user/queries/resolve-mentions.query";
import { Container } from "@azure/cosmos";
import { InjectModel } from "@dinohorvat/azure-database";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { UserProfile } from "../models/user.model";

@QueryHandler(ResolveMentionsQuery)
export class ResolveMentionsQueryHandler implements IQueryHandler<ResolveMentionsQuery> {
  constructor(@InjectModel(UserProfile) private readonly userContainer: Container) {}
  async execute(query: ResolveMentionsQuery): Promise<UserId[]> {
    const list = query.names.map((x) => `'${x}'`).join(",");
    const { resources: mentions } = await this.userContainer.items
      .query({
        query: `SELECT VALUE u.id FROM u WHERE u.displayName IN (${list})`,
      })
      .fetchAll();

    return mentions;
  }
}
