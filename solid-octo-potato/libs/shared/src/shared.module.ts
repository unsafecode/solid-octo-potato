import { AzureBindingsModule } from '@app/azure-bindings';
import { AzureServiceBusCommandBus } from '@app/azure-bindings/AzureServiceBusCommandBus';
import { AzureServiceBusQueryBus } from '@app/azure-bindings/AzureServiceBusQueryBus';
import { AzureServiceBusEventBus } from '@app/azure-bindings/AzureServiceBusEventBus';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';

@Module({
  imports: [
    AzureBindingsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  providers: [
    // See https://docs.nestjs.com/fundamentals/custom-providers#standard-providers
    {
      provide: CommandBus,
      useClass: AzureServiceBusCommandBus,
    },
    {
      provide: QueryBus,
      useClass: AzureServiceBusQueryBus,
    },
    {
      provide: EventBus,
      useClass: AzureServiceBusEventBus,
    },
  ],
  exports: [CommandBus, QueryBus, EventBus],
})
export class SharedModule {}
