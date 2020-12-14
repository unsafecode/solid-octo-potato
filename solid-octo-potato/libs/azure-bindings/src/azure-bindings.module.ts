import { Module } from '@nestjs/common';
import { AzureServiceBusCommandBus } from './AzureServiceBusCommandBus';
import { AzureServiceBusQueryBus } from './AzureServiceBusQueryBus';
import { AzureServiceBusEventBus } from './AzureServiceBusEventBus';
import { DiscoveryService } from './DiscoveryService';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    AzureServiceBusCommandBus,
    AzureServiceBusQueryBus,
    AzureServiceBusEventBus,
    DiscoveryService,
  ],
  exports: [
    AzureServiceBusCommandBus,
    AzureServiceBusQueryBus,
    AzureServiceBusEventBus,
    DiscoveryService,
  ],
})
export class AzureBindingsModule {}
