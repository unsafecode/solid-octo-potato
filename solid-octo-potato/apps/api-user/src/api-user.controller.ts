import { UserCreateCommand, UserFollowUserCommand, UserGetProfileQuery, UserUnFollowUserCommand } from '@app/models/user';
import { Body, Controller, Get, HttpCode, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';

// @UseGuards(AuthGuard("azure-ad"))
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
  async register(@Body() { firstName, lastName, displayName, email, upn, aboutMe }) {
    return await this.cmdBus.execute(new UserCreateCommand(firstName, lastName, displayName, email, upn, aboutMe));
  }

  @Post(":id/follow")
  @HttpCode(200)
  async followUser(@Param("id") targetUserId) {
    const sourceUserId = "cbef4451-2595-401f-af51-6272936d9f9c";
    return await this.cmdBus.execute(new UserFollowUserCommand(sourceUserId, targetUserId));
  }

  @Post(":id/unfollow")
  @HttpCode(200)
  async unfollowUser(@Param("id") targetUserId) {
    const sourceUserId = "cbef4451-2595-401f-af51-6272936d9f9c";
    return await this.cmdBus.execute(new UserUnFollowUserCommand(sourceUserId, targetUserId));
  }
}
