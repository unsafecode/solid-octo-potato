import { MyNewsfeedQuery } from '@app/models/conversation/queries/my-newfeed.query';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ConversationDomainService } from '../conversation-domain.service';

@QueryHandler(MyNewsfeedQuery)
export class MyNewsfeedQueryHandler implements IQueryHandler<MyNewsfeedQuery> {
  private readonly logger = new Logger(MyNewsfeedQueryHandler.name);
  constructor(private readonly svc: ConversationDomainService) {
  }
  async execute(query: MyNewsfeedQuery): Promise<any> {
    return [{ content: 'test', x: Math.floor(Math.random() * 10) }];
  }
}
