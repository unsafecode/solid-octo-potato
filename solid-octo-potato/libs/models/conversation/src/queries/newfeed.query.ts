import { HashtagId, UserId } from '../types';

export class NewsfeedQuery {
  constructor(
    public readonly users: UserId[],
    public readonly hashtags: HashtagId[],
  ) {}
}
