import { Module } from '@nestjs/common';
import { AzureServiceBusCommandBus } from './AzureServiceBusCommandBus';
import { AzureServiceBusQueryBus } from './AzureServiceBusQueryBus';
import { AzureServiceBusEventBus } from './AzureServiceBusEventBus';
import { DiscoveryService } from './DiscoveryService';
import { CqrsModule } from '@nestjs/cqrs';
import { ServiceBusUtilsService } from './service-bus-utils.service';

@Module({
  imports: [CqrsModule],
  providers: [
    AzureServiceBusCommandBus,
    AzureServiceBusQueryBus,
    AzureServiceBusEventBus,
    DiscoveryService,
    ServiceBusUtilsService,
  ],
  exports: [
    AzureServiceBusCommandBus,
    AzureServiceBusQueryBus,
    AzureServiceBusEventBus,
    DiscoveryService,
    ServiceBusUtilsService,
  ],
})
export class AzureBindingsModule {}
