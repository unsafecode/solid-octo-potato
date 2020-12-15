import { UserCreateCommand, UserGetProfileQuery } from '@app/models/user';
import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Controller("api/user")
export class ApiUserController {
  private readonly logger = new Logger(ApiUserController.name);
  constructor(
    private readonly cmdBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(":id")
  async getProfile(@Param("id") id: string) {
    this.logger.debug(id);
    return await this.queryBus.execute(new UserGetProfileQuery(id));
  }

  @Post()
  async register(@Body() { firstName, lastName, email, upn, aboutMe }) {
    return await this.cmdBus.execute(new UserCreateCommand(firstName, lastName, email, upn, aboutMe));
  }
}
