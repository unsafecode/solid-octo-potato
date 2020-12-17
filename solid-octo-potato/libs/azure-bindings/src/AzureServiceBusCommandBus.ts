import {
  ICommand,
  CommandHandlerType,
  ICommandHandler,
  InvalidCommandHandlerException,
  ICommandBus,
  ObservableBus,
} from '@nestjs/cqrs';
import { ServiceBusSender } from '@azure/service-bus';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DiscoveryService } from './DiscoveryService';
import { ServiceBusUtilsService } from './service-bus-utils.service';

const COMMANDS_TOPIC_NAME = 'commands';
const COMMAND_HANDLER_METADATA = '__commandHandler__';

@Injectable()
export class AzureServiceBusCommandBus<CommandBase extends ICommand = ICommand>
  extends ObservableBus<CommandBase>
  implements ICommandBus<CommandBase>, OnModuleInit {
  sender: ServiceBusSender;
  private readonly logger = new Logger(AzureServiceBusCommandBus.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly sbUtils: ServiceBusUtilsService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.sbUtils.ensureTopicExists(COMMANDS_TOPIC_NAME);

    this.sender = this.sbUtils.createSender(COMMANDS_TOPIC_NAME);

    const commands = this.discoveryService.discover<ICommandHandler>(
      COMMAND_HANDLER_METADATA,
    );

    this.register(commands);
  }

  async execute<T extends CommandBase>(command: T): Promise<any> {
    const commandName = command.constructor.name;
    const sessionId = `${commandName}-${uuidv4()}`;
    await this.sender.sendMessages({
      replyToSessionId: sessionId, // VERY IMPORTANT, requests are NOT session-based, only responses!
      body: command,
      applicationProperties: {
        Command: commandName,
        Kind: 'input',
      },
    });

    const result = await this.sbUtils.waitForResponse<any>(
      COMMANDS_TOPIC_NAME,
      `${commandName}Result`,
      sessionId,
    );

    return result;
  }

  async bind<T extends CommandBase>(
    handler: ICommandHandler<T>,
    commandName: string,
  ) {
    await this.sbUtils.ensureSubscriptionExists(
      COMMANDS_TOPIC_NAME,
      commandName,
      `Command = @Command AND Kind = @kind`,
      { '@Command': commandName, '@kind': 'input' },
      { requiresSession: false },
    );
    await this.sbUtils.ensureSubscriptionExists(
      COMMANDS_TOPIC_NAME,
      `${commandName}Result`,
      `Command = @Command AND Kind = @kind`,
      { '@Command': commandName, '@kind': 'output' },
      { requiresSession: true },
    );
    const sbCommandHandler = this.sbUtils.createReceiver(
      COMMANDS_TOPIC_NAME,
      commandName,
    );
    sbCommandHandler.subscribe({
      processMessage: async (message) => {
        let result: any,
          hasError = false;
        try {
          result = await handler.execute(message.body);
        } catch (error) {
          this.logger.error(error.message);
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
              Command: commandName,
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
