import {
  ICommand,
  CommandHandlerType,
  ICommandHandler,
  InvalidCommandHandlerException,
  ICommandBus,
  ObservableBus,
} from '@nestjs/cqrs';
import {
  ServiceBusAdministrationClient,
  ServiceBusClient,
  ServiceBusSender,
} from '@azure/service-bus';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IApplicationConfig } from '@app/shared/config';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { DiscoveryService } from './DiscoveryService';

const COMMANDS_TOPIC_NAME = 'commands';
const COMMAND_HANDLER_METADATA = '__commandHandler__';

@Injectable()
export class AzureServiceBusCommandBus<CommandBase extends ICommand = ICommand>
  extends ObservableBus<CommandBase>
  implements ICommandBus<CommandBase>, OnModuleInit {
  serviceBusClient: ServiceBusClient;
  sender: ServiceBusSender;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  private readonly logger = new Logger(AzureServiceBusCommandBus.name);

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
        COMMANDS_TOPIC_NAME,
      ))
    ) {
      await this.serviceBusAdministrationClient.createTopic(
        COMMANDS_TOPIC_NAME,
      );
    }

    this.sender = this.serviceBusClient.createSender(COMMANDS_TOPIC_NAME);

    const commands = this.discoveryService.discover<ICommandHandler>(
      COMMAND_HANDLER_METADATA,
    );

    this.register(commands);
  }

  async execute<T extends CommandBase>(command: T): Promise<any> {
    const transactionId = uuidv4();
    await this.sender.sendMessages({
      body: command,
      applicationProperties: {
        Command: command.constructor.name,
        transactionId,
      },
    });

    return { transactionId };
  }

  async bind<T extends CommandBase>(
    handler: ICommandHandler<T>,
    commandName: string,
  ) {
    if (
      !(await this.serviceBusAdministrationClient.subscriptionExists(
        COMMANDS_TOPIC_NAME,
        commandName,
      ))
    ) {
      await this.serviceBusAdministrationClient.createSubscription(
        COMMANDS_TOPIC_NAME,
        commandName,
      );
    } else {
      const sub = await this.serviceBusAdministrationClient.getRule(
        COMMANDS_TOPIC_NAME,
        commandName,
        '$Default',
      );
      await this.serviceBusAdministrationClient.updateRule(
        COMMANDS_TOPIC_NAME,
        commandName,
        {
          ...sub,
          filter: {
            sqlExpression: `Command = @name`,
            sqlParameters: {
              '@name': commandName,
            },
          },
        },
      );
    }
    const sbCommandHandler = this.serviceBusClient.createReceiver(
      COMMANDS_TOPIC_NAME,
      commandName,
    );
    sbCommandHandler.subscribe({
      processMessage: async (args) => {
        const { transactionId } = args.applicationProperties;
        let result: any;
        let isError = false;
        try {
          result = await handler.execute(args.body);
        } catch (error) {
          isError = true;
          result = {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
          };
        } finally {
          await this.sender.sendMessages([
            {
              body: result,
              applicationProperties: {
                ResultOf: commandName,
                Error: isError,
                transactionId,
              },
            },
          ]);
        }
      },
      processError: async (args) => {
        this.logger.error(args.error.message);
      },
    });
  }

  register(handlers: CommandHandlerType[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: CommandHandlerType) {
    const instance = this.discoveryService.get(handler);
    if (!instance) {
      return;
    }
    const target = this.reflectCommandName(handler);
    if (!target) {
      throw new InvalidCommandHandlerException();
    }
    this.bind(instance, target.name);
  }
  private reflectCommandName(handler: CommandHandlerType): FunctionConstructor {
    return Reflect.getMetadata(COMMAND_HANDLER_METADATA, handler);
  }
}
