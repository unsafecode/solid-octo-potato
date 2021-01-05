import { SharedModule } from "@app/shared";
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AzureADStrategy } from "./azure-ad.guard";

@Module({
  // see https://www.npmjs.com/package/nest-azure-ad-jwt-validator
  imports: [PassportModule, SharedModule],
  providers: [AzureADStrategy],
  exports: [AzureADStrategy, SharedModule],
})
export class ApiCommonsModule {}
