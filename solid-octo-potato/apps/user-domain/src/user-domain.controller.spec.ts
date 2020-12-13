import { Test, TestingModule } from '@nestjs/testing';
import { UserDomainController } from './user-domain.controller';
import { UserDomainService } from './user-domain.service';

describe('UserDomainController', () => {
  let userDomainController: UserDomainController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserDomainController],
      providers: [UserDomainService],
    }).compile();

    userDomainController = app.get<UserDomainController>(UserDomainController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(userDomainController.getHello()).toBe('Hello World!');
    });
  });
});
