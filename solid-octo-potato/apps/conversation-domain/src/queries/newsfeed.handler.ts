import { NewsfeedQuery } from '@app/models/conversation/queries/newfeed.query';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConversationDomainService } from '../conversation-domain.service';

@QueryHandler(NewsfeedQuery)
export class MyNewsfeedQueryHandler implements IQueryHandler<NewsfeedQuery> {
  private readonly logger = new Logger(MyNewsfeedQueryHandler.name);
  constructor(private readonly svc: ConversationDomainService) {
  }
  async execute({ hashtags, users }: NewsfeedQuery): Promise<string[]> {
    return await this.svc.getNewsfeed(users, hashtags);
  }
}
