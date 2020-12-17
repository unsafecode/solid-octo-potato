import { HashtagId } from "@app/models/conversation";
import { ResolveHashtagsCommand } from "@app/models/hashtag/commands/resolve-hashtags.command";
import { Container } from "@azure/cosmos";
import { InjectModel } from "@dinohorvat/azure-database";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Hashtag } from "../models/hashtag.model";

@CommandHandler(ResolveHashtagsCommand)
export class ResolveHashtagsCommandHandler implements ICommandHandler<ResolveHashtagsCommand> {
  constructor(@InjectModel(Hashtag) private readonly container: Container) {}
  async execute(command: ResolveHashtagsCommand): Promise<HashtagId[]> {
    const list = command.names.map(x => `'${x}'`);
    const { resources: existing } = await this.container.items
      .query<Hashtag>({
        query: `SELECT * FROM c WHERE c.hashtag IN (${list})`,
      })
      .fetchAll();

    const existingIds = existing.map((h) => h.hashtag);
    const toCreate = command.names.filter((x) => !existingIds.includes(x));

    const created = (await Promise.all(
      toCreate
        .map((hashtag) => ({
            hashtag
        }))
        .map((x) => Object.assign(new Hashtag(), x) as Hashtag)
        .map(h => this.container.items.create(h)),
    )).map(res => res.resource);

    return [...existing, ...created].map(h => h.id);
  }
}
