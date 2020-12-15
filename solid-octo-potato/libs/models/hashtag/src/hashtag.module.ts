import { Module } from '@nestjs/common';
import { Models/hashtagService } from './models/hashtag.service';

@Module({
  providers: [Models/hashtagService],
  exports: [Models/hashtagService],
})
export class Models/hashtagModule {}
