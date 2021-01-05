import { ApiCommonsModule } from "@app/api-commons";
import { SharedModule } from "@app/shared";
import { Module } from "@nestjs/common";
import { ApiNewsfeedController } from "./api-newsfeed.controller";

@Module({
  imports: [SharedModule, ApiCommonsModule],
  controllers: [ApiNewsfeedController],
  providers: [],
})
export class ApiNewsfeedModule {}
