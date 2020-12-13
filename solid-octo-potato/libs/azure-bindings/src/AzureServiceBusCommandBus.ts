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
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import { IApplicationConfig } from '@app/shared/config';
import { ConfigService } from '@nestjs/config';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

const COMMANDS_TOPIC_NAME = 'commands';
const COMMAND_HANDLER_METADATA = '__commandHandler__';

@Injectable()
export class AzureServiceBusCommandBus<CommandBase extends ICommand = ICommand>
  extends ObservableBus<CommandBase>
  implements ICommandBus<CommandBase> {
  serviceBusClient: ServiceBusClient;
  sender: ServiceBusSender;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  private readonly logger = new Logger(AzureServiceBusCommandBus.name);
  /**
   *
   */
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly modulesContainer: ModulesContainer,
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
  async setup() {
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

    const modules = [...this.modulesContainer.values()];
    const commands = this.flatMap<ICommandHandler>(modules, (instance) =>
      this.filterProvider(instance, COMMAND_HANDLER_METADATA),
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

  async execute<T extends CommandBase>(command: T): Promise<any> {
    await this.sender.sendMessages({
      body: command,
      applicationProperties: {
        Command: command.constructor.name,
      },
    });
  }

  async bind<T extends CommandBase>(handler: ICommandHandler<T>, commandName: string) {
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
        const result = await handler.execute(args.body);
        await this.sender.sendMessages([{
          body: result,
          applicationProperties: {
            "ResultOf": commandName,
            "Error": false
          }
        }]);
      },
      processError: async (args) => {
        await this.sender.sendMessages([{
          body: {
            errorMessage: args.error.message,
            errorName: args.error.name,
            errorStack: args.error.stack
          },
          applicationProperties: {
            "ResultOf": commandName,
            "Error": true
          }
        }]);
      },
    });
  }

  register(handlers: CommandHandlerType[] = []) {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  protected registerHandler(handler: CommandHandlerType) {
    const instance = this.moduleRef.get(handler, { strict: false });
    if (!instance) {
      return;
    }
    const target = this.reflectCommandName(handler);
    if (!target) {
      throw new InvalidCommandHandlerException();
    }
    this.bind(instance as ICommandHandler<CommandBase>, target.name);
  }
  private reflectCommandName(handler: CommandHandlerType): FunctionConstructor {
    return Reflect.getMetadata(COMMAND_HANDLER_METADATA, handler);
  }
}
