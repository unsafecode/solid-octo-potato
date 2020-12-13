import { MyNewsfeedQuery } from '@app/models/conversation/queries/my-newfeed.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(MyNewsfeedQuery)
export class MyNewsfeedQueryHandler implements IQueryHandler<MyNewsfeedQuery> {
  constructor() {}
  async execute(query: MyNewsfeedQuery): Promise<any> {
    return [{ content: 'test' }];
  }
}
