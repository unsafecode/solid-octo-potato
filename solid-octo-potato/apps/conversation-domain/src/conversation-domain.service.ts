import { Container } from '@azure/cosmos';
import { InjectModel } from '@dinohorvat/azure-database';
import { Injectable } from '@nestjs/common';
import { Post } from './models/post.model';

@Injectable()
export class ConversationDomainService {
  constructor(
    @InjectModel(Post) private readonly container: Container) {
    
  }

  async createRoot(input: Post) {
    await this.container.items.create(input);
  }
}
