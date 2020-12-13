import {
  InvalidQueryHandlerException,
  IQuery,
  IQueryBus,
  IQueryHandler,
  IQueryResult,
  ObservableBus,
  QueryBus,
  QueryHandlerNotFoundException,
  QueryHandlerType,
} from '@nestjs/cqrs';
import {
  ServiceBusAdministrationClient,
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusSender,
} from '@azure/service-bus';
import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { IApplicationConfig } from '@app/shared/config';
import { ConfigService } from '@nestjs/config';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { v4 as uuidv4 } from 'uuid';

const QUERIES_TOPIC_NAME = 'queries';
const QUERY_HANDLER_METADATA = '__queryHandler__';

@Injectable()
export class AzureServiceBusQueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase> {
  serviceBusClient: ServiceBusClient;
  sender: ServiceBusSender;
  receiver: ServiceBusReceiver;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  private readonly logger = new Logger(AzureServiceBusQueryBus.name);
  /**
   *
   */
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly modulesContainer: ModulesContainer,
    private readonly configSvc: ConfigService<IApplicationConfig>,
  ) {
    super();
    const cnn = configSvc.get<string>('ServiceBusConnectionString');
    this.serviceBusClient = new ServiceBusClient(cnn);
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(
      cnn,
    );

    this.setup();
  }
  async setup() {
    if (
      !(await this.serviceBusAdministrationClient.topicExists(
        QUERIES_TOPIC_NAME,
      ))
    ) {
      await this.serviceBusAdministrationClient.createTopic(QUERIES_TOPIC_NAME);
    }

    this.sender = this.serviceBusClient.createSender(QUERIES_TOPIC_NAME);

    const modules = [...this.modulesContainer.values()];
    const commands = this.flatMap<IQueryHandler>(modules, (instance) =>
      this.filterProvider(instance, QUERY_HANDLER_METADATA),
    );

    this.register(commands);
  }

  flatMap<T>(
    modules: Module[],
    callback: (instance: InstanceWrapper) => Type<any> | undefined,
  ): Type<T>[] {
    const items = modules
      .map((module) => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), []);
    return items.filter((element) => !!element) as Type<T>[];
  }

  filterProvider(
    wrapper: InstanceWrapper,
    metadataKey: string,
  ): Type<any> | undefined {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return this.extractMetadata(instance, metadataKey);
  }

  extractMetadata(
    instance: Record<string, any>,
    metadataKey: string,
  ): Type<any> {
    if (!instance.constructor) {
      return;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
    return metadata ? (instance.constructor as Type<any>) : undefined;
  }

  async execute<T extends QueryBase, TResult = any>(
    query: T,
  ): Promise<TResult> {
    const queryName = query.constructor.name;
    const sessionId = `${queryName}-${uuidv4()}`;
    await this.sender.sendMessages({
      sessionId,
      body: query,
      applicationProperties: {
        Query: queryName,
      },
    });

    const receiver = await this.serviceBusClient.acceptSession(
      QUERIES_TOPIC_NAME,
      queryName,
      sessionId,
    );
    const [message] = await receiver.receiveMessages(1);

    const result = message.body as TResult;

    return result;
  }

  async bind<T extends QueryBase, TResult = any>(
    handler: IQueryHandler<T, TResult>,
    queryName: string,
  ) {
    if (
      !(await this.serviceBusAdministrationClient.subscriptionExists(
        QUERIES_TOPIC_NAME,
        queryName,
      ))
    ) {
      await this.serviceBusAdministrationClient.createSubscription(
        QUERIES_TOPIC_NAME,
        queryName,
        { requiresSession: true },
      );
    } else {
      const sub = await this.serviceBusAdministrationClient.getRule(
        QUERIES_TOPIC_NAME,
        queryName,
        '$Default',
      );
      await this.serviceBusAdministrationClient.updateRule(
        QUERIES_TOPIC_NAME,
        queryName,
        {
          ...sub,
          filter: {
            sqlExpression: `Query = @queryName`,
            sqlParameters: { '@queryName': queryName },
          },
        },
      );
    }
    const sbCommandHandler = this.serviceBusClient.createReceiver(
      QUERIES_TOPIC_NAME,
      queryName,
    );
    sbCommandHandler.subscribe({
      processMessage: async (message) => {
        await handler.execute(message.body);
      },
      processError: async (args) => {
        this.logger.error(args.error);
      },
    });
  }

  register(handlers: QueryHandlerType<QueryBase>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: QueryHandlerType<QueryBase>) {
    const instance = this.moduleRef.get(handler, { strict: false });
    if (!instance) {
      return;
    }
    const target = this.reflectQueryName(handler);
    if (!target) {
      throw new InvalidQueryHandlerException();
    }
    this.bind(instance as IQueryHandler<QueryBase, IQueryResult>, target.name);
  }

  private reflectQueryName(
    handler: QueryHandlerType<QueryBase>,
  ): FunctionConstructor {
    return Reflect.getMetadata(QUERY_HANDLER_METADATA, handler);
  }
}
