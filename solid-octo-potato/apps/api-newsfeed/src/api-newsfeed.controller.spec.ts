import { Test, TestingModule } from '@nestjs/testing';
import { ApiNewsfeedController } from './api-newsfeed.controller';
import { ApiNewsfeedService } from './api-newsfeed.service';

describe('ApiNewsfeedController', () => {
  let apiNewsfeedController: ApiNewsfeedController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiNewsfeedController],
      providers: [ApiNewsfeedService],
    }).compile();

    apiNewsfeedController = app.get<ApiNewsfeedController>(ApiNewsfeedController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiNewsfeedController.getHello()).toBe('Hello World!');
    });
  });
});
