import { Injectable } from '@nestjs/common';

@Injectable()
export class UserDomainService {
  getHello(): string {
    return 'Hello World!';
  }
}
