import {
  InvalidCommandHandlerException,
  ObservableBus,
  IEvent,
  IEventBus,
  IEventHandler,
  EventHandlerType,
} from '@nestjs/cqrs';
import {
  ServiceBusAdministrationClient,
  ServiceBusClient,
  ServiceBusSender,
} from '@azure/service-bus';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { IApplicationConfig } from '@app/shared/config';
import { ConfigService } from '@nestjs/config';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { DiscoveryService } from './DiscoveryService';

const EVENTS_TOPIC_NAME = 'events';
const EVENT_HANDLER_METADATA = '__eventsHandler';

@Injectable()
export class AzureServiceBusEventBus<EventBase extends IEvent = IEvent>
  extends ObservableBus<EventBase>
  implements IEventBus<EventBase> {
  serviceBusClient: ServiceBusClient;
  sender: ServiceBusSender;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  private readonly logger = new Logger(AzureServiceBusEventBus.name);
  /**
   *
   */
  constructor(
    private readonly discoveryService: DiscoveryService,
    configSvc: ConfigService<IApplicationConfig>,
  ) {
    super();
    const cnn = configSvc.get<string>('ServiceBusConnectionString');
    this.serviceBusClient = new ServiceBusClient(cnn);
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(
      cnn,
    );

    this.setup();
  }
  async publish<T extends EventBase>(event: T) {
    await this.sender.sendMessages({
      body: event,
      applicationProperties: {
        Event: event.constructor.name,
      },
    });
  }
  publishAll(events: EventBase[]) {
    events.forEach((ev) => this.publish(ev));
  }
  async setup() {
    if (
      !(await this.serviceBusAdministrationClient.topicExists(
        EVENTS_TOPIC_NAME,
      ))
    ) {
      await this.serviceBusAdministrationClient.createTopic(EVENTS_TOPIC_NAME);
    }

    this.sender = this.serviceBusClient.createSender(EVENTS_TOPIC_NAME);

    const events = this.discoveryService.discover<IEventHandler<EventBase>>(EVENT_HANDLER_METADATA);
    
    this.register(events);
  }

  async bind<T extends EventBase>(handler: IEventHandler<T>, name: string) {
    if (
      !(await this.serviceBusAdministrationClient.subscriptionExists(
        EVENTS_TOPIC_NAME,
        name,
      ))
    ) {
      await this.serviceBusAdministrationClient.createSubscription(
        EVENTS_TOPIC_NAME,
        name,
      );
    } else {
      const sub = await this.serviceBusAdministrationClient.getRule(
        EVENTS_TOPIC_NAME,
        name,
        '$Default',
      );
      await this.serviceBusAdministrationClient.updateRule(
        EVENTS_TOPIC_NAME,
        name,
        {
          ...sub,
          filter: {
            sqlExpression: `Event = @name`,
            sqlParameters: {
              '@name': name,
            },
          },
        },
      );
    }
    const sbEventHandler = this.serviceBusClient.createReceiver(
      EVENTS_TOPIC_NAME,
      name,
    );
    sbEventHandler.subscribe({
      processMessage: async (args) => {
        await handler.handle(args.body);
      },
      processError: async (args) => {
        this.logger.error(args.error.message);
      },
    });
  }

  register(handlers: EventHandlerType<EventBase>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: EventHandlerType<EventBase>) {
    const instance = this.discoveryService.get(handler);
    if (!instance) {
      return;
    }

    const eventsNames = this.reflectEventsNames(handler);
    eventsNames.map((event) =>
      this.bind(instance as IEventHandler<EventBase>, event.name),
    );
  }
  private reflectEventsNames(
    handler: EventHandlerType<EventBase>,
  ): FunctionConstructor[] {
    return Reflect.getMetadata(EVENT_HANDLER_METADATA, handler);
  }
}
