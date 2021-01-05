import { UserInfo } from "@app/models/user/dto/user-info.dto";
import { UserGetInfo } from "@app/models/user/queries/get-user-info.query";
import { Injectable, Logger } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { PassportStrategy } from "@nestjs/passport";
import { BearerStrategy } from "passport-azure-ad";
/**
 * Extracts ID token from header and validates it.
 */
const tenantID = "c5dd3cf9-b5b1-4951-a36b-5ef25fb0f353";
const clientID = "d1c7fab7-57b8-4c81-afda-7d5387c93c50";
@Injectable()
export class AzureADStrategy extends PassportStrategy(BearerStrategy, "azure-ad") {
  private readonly logger = new Logger(AzureADStrategy.name);
  constructor(private readonly queryBus: QueryBus) {
    super({
      identityMetadata: `https://login.microsoftonline.com/${tenantID}/v2.0/.well-known/openid-configuration`,
      clientID,
      loggingLevel: "error",
      loggingNoPII: true,
      issuer: `https://sts.windows.net/${tenantID}/`,
    });
  }

  async validate(tokenData) {
    const user: UserInfo = await this.queryBus.execute(new UserGetInfo(tokenData.upn));
    return user;
  }
}
