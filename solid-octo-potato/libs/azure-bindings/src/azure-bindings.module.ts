import { Module } from '@nestjs/common';
import { AzureServiceBusCommandBus } from './AzureServiceBusCommandBus';
import { AzureServiceBusQueryBus } from './AzureServiceBusQueryBus';
import { AzureServiceBusEventBus } from './AzureServiceBusEventBus';

@Module({
  providers: [AzureServiceBusCommandBus, AzureServiceBusQueryBus, AzureServiceBusEventBus],
  exports: [AzureServiceBusCommandBus, AzureServiceBusQueryBus, AzureServiceBusEventBus],
})
export class AzureBindingsModule {}
