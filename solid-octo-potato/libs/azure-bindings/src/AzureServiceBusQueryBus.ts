import {
  InvalidQueryHandlerException,
  IQuery,
  IQueryBus,
  IQueryHandler,
  ObservableBus,
  QueryHandlerType,
} from '@nestjs/cqrs';
import {
  ServiceBusSender,
} from '@azure/service-bus';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DiscoveryService } from './DiscoveryService';
import { ServiceBusUtilsService } from './service-bus-utils.service';

const QUERIES_TOPIC_NAME = 'queries';
const QUERY_HANDLER_METADATA = '__queryHandler__';

@Injectable()
export class AzureServiceBusQueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase>, OnModuleInit {
  private sender: ServiceBusSender;
  private readonly logger = new Logger(AzureServiceBusQueryBus.name);
  /**
   *
   */
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly sbUtils: ServiceBusUtilsService,
  ) {
    super();
  }
  async onModuleInit() {
    await this.sbUtils.ensureTopicExists(QUERIES_TOPIC_NAME);

    this.sender = this.sbUtils.createSender(QUERIES_TOPIC_NAME);

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

    const result = await this.sbUtils.waitForResponse<TResult>(
      QUERIES_TOPIC_NAME,
      `${queryName}Result`,
      sessionId,
    );

    return result;
  }

  private async bindHandler<T extends QueryBase, TResult = any>(
    handler: IQueryHandler<T, TResult>,
    queryName: string,
  ) {
    await this.sbUtils.ensureSubscriptionExists(
      QUERIES_TOPIC_NAME,
      queryName,
      `Query = @queryName AND Kind = @kind`,
      { '@queryName': queryName, '@kind': 'input' },
      { requiresSession: false },
    );
    await this.sbUtils.ensureSubscriptionExists(
      QUERIES_TOPIC_NAME,
      `${queryName}Result`,
      `Query = @queryName AND Kind = @kind`,
      { '@queryName': queryName, '@kind': 'output' },
      { requiresSession: true },
    );

    this.logger.debug('Registering ' + handler.constructor.name);

    const sbQueryHandler = await this.sbUtils.createReceiver(
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
