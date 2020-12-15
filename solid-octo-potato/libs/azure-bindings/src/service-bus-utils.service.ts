import { IApplicationConfig } from '@app/shared/config';
import {
  ServiceBusClient,
  ServiceBusAdministrationClient,
  CreateSubscriptionOptions,
} from '@azure/service-bus';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceBusUtilsService {
  serviceBusClient: ServiceBusClient;
  serviceBusAdministrationClient: ServiceBusAdministrationClient;
  constructor(private readonly configSvc: ConfigService<IApplicationConfig>) {
    const cnn = this.configSvc.get<string>('ServiceBusConnectionString');
    this.serviceBusClient = new ServiceBusClient(cnn);
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(
      cnn,
    );
  }

  async ensureTopicExists(topicName: string) {
    if (!(await this.serviceBusAdministrationClient.topicExists(topicName))) {
      await this.serviceBusAdministrationClient.createTopic(topicName);
    }
  }

  async ensureSubscriptionExists(
    topicName: string,
    subscriptionName: string,
    sqlExpression: string,
    sqlParameters: { [key: string]: string | number | boolean },
    options?: CreateSubscriptionOptions
  ) {
    if (
      !(await this.serviceBusAdministrationClient.subscriptionExists(
        topicName,
        subscriptionName,
      ))
    ) {
      await this.serviceBusAdministrationClient.createSubscription(
        topicName,
        subscriptionName,
        options
      );
    } else {
      const sub = await this.serviceBusAdministrationClient.getRule(
        topicName,
        subscriptionName,
        '$Default',
      );
      await this.serviceBusAdministrationClient.updateRule(
        topicName,
        subscriptionName,
        {
          ...sub,
          filter: {
            sqlExpression,
            sqlParameters,
          },
        },
      );
    }
  }

  createSender(topicName: string) {
    return this.serviceBusClient.createSender(topicName);
  }

  createReceiver(topicName: string, subscriptionName: string) {
    return this.serviceBusClient.createReceiver(topicName, subscriptionName);
  }

  async waitForResponse<TResult = any>(topicName: string, subscriptionName: string, sessionId: string): Promise<TResult> {
      
    const receiver = await this.serviceBusClient.acceptSession(
        topicName,
        subscriptionName,
        sessionId,
      );
      const [message] = await receiver.receiveMessages(1);
  
      const result = message.body as TResult;
      await receiver.completeMessage(message);
      await receiver.close();

      return result;
  }
}
