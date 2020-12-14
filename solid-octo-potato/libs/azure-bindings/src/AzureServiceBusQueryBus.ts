import {
  InvalidQueryHandlerException,
  IQuery,
  IQueryBus,
  IQueryHandler,
  IQueryResult,
  ObservableBus,
  QueryHandlerType,
} from '@nestjs/cqrs';
import {
  ServiceBusAdministrationClient,
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusSender,
} from '@azure/service-bus';
import { Injectable, Logger, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { IApplicationConfig } from '@app/shared/config';
import { ConfigService } from '@nestjs/config';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { v4 as uuidv4 } from 'uuid';
import { DiscoveryService } from './DiscoveryService';

const QUERIES_TOPIC_NAME = 'queries';
const QUERY_HANDLER_METADATA = '__queryHandler__';

@Injectable()
export class AzureServiceBusQueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase>, OnModuleInit {
  serviceBusClient: ServiceBusClient;
  sender: ServiceBusSender;
  receiver: ServiceBusReceiver;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  private readonly logger = new Logger(AzureServiceBusQueryBus.name);
  /**
   *
   */
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly configSvc: ConfigService<IApplicationConfig>,
  ) {
    super();
  }
  async onModuleInit() {
    const cnn = this.configSvc.get<string>('ServiceBusConnectionString');
    this.serviceBusClient = new ServiceBusClient(cnn);
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(
      cnn,
    );
    if (
      !(await this.serviceBusAdministrationClient.topicExists(
        QUERIES_TOPIC_NAME,
      ))
    ) {
      await this.serviceBusAdministrationClient.createTopic(QUERIES_TOPIC_NAME);
    }

    this.sender = this.serviceBusClient.createSender(QUERIES_TOPIC_NAME);

    const queryHandlers = this.discoveryService.discover<IQueryHandler>(
      QUERY_HANDLER_METADATA,
    );

    this.register(queryHandlers);
  }

  async execute<T extends QueryBase, TResult = any>(
    query: T,
  ): Promise<TResult> {
    const queryName = query.constructor.name;
    const sessionId = `${queryName}-${uuidv4()}`;
    await this.sender.sendMessages({
      replyToSessionId: sessionId, // VERY IMPORTANT, requests are NOT session-based, only responses!
      body: query,
      applicationProperties: {
        Query: queryName,
        Kind: 'input',
      },
    });

    const queryNameResult = `${queryName}Result`;
    const receiver = await this.serviceBusClient.acceptSession(
      QUERIES_TOPIC_NAME,
      queryNameResult,
      sessionId,
    );
    const [message] = await receiver.receiveMessages(1);

    const result = message.body as TResult;
    await receiver.completeMessage(message);
    await receiver.close();

    return result;
  }

  private async bindHandler<T extends QueryBase, TResult = any>(
    handler: IQueryHandler<T, TResult>,
    queryName: string,
  ) {
    await this.ensureSubscriptionExists(queryName, false, queryName, 'input');
    await this.ensureSubscriptionExists(
      `${queryName}Result`,
      true,
      queryName,
      'output',
    );

    this.logger.debug('Registering ' + handler.constructor.name);

    const sbQueryHandler = await this.serviceBusClient.createReceiver(
      QUERIES_TOPIC_NAME,
      queryName,
    );
    sbQueryHandler.subscribe({
      processMessage: async (message) => {
        let result: any,
          hasError = false;
        try {
          result = await handler.execute(message.body);
        } catch (error) {
          result = {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
          };
          hasError = true;
        } finally {
          await this.sender.sendMessages({
            sessionId: message.replyToSessionId,
            body: result,
            applicationProperties: {
              Query: queryName,
              Kind: 'output',
              hasError,
            },
          });
        }
      },
      processError: async (args) => {
        this.logger.error(args.error);
      },
    });
  }

  private async ensureSubscriptionExists(
    subscriptionName: string,
    requiresSession: boolean,
    queryName: string,
    kind: string,
  ) {
    if (
      !(await this.serviceBusAdministrationClient.subscriptionExists(
        QUERIES_TOPIC_NAME,
        subscriptionName,
      ))
    ) {
      await this.serviceBusAdministrationClient.createSubscription(
        QUERIES_TOPIC_NAME,
        subscriptionName,
        { requiresSession },
      );
    } else {
      const sub = await this.serviceBusAdministrationClient.getRule(
        QUERIES_TOPIC_NAME,
        subscriptionName,
        '$Default',
      );
      await this.serviceBusAdministrationClient.updateRule(
        QUERIES_TOPIC_NAME,
        subscriptionName,
        {
          ...sub,
          filter: {
            sqlExpression: `Query = @queryName AND Kind = @kind`,
            sqlParameters: { '@queryName': queryName, '@kind': kind },
          },
        },
      );
    }
  }

  register(handlers: QueryHandlerType<QueryBase>[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: QueryHandlerType<QueryBase>) {
    const instance = this.discoveryService.get(handler);
    if (!instance) {
      return;
    }
    const target = this.reflectQueryName(handler);
    if (!target) {
      throw new InvalidQueryHandlerException();
    }
    this.bindHandler(instance, target.name);
  }

  private reflectQueryName(
    handler: QueryHandlerType<QueryBase>,
  ): FunctionConstructor {
    return Reflect.getMetadata(QUERY_HANDLER_METADATA, handler);
  }
}
