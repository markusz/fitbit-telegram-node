import * as cdk from '@aws-cdk/core';
import { RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { ApiGatewayv2DomainProperties } from '@aws-cdk/aws-route53-targets';
import { DomainName, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Runtime } from '@aws-cdk/aws-lambda';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { Secret } from '@aws-cdk/aws-secretsmanager';

interface FitbitLoggerStackProps extends StackProps {
  hostedZone: {
    id: string,
    name: string,
  },
  secretsName: string
}

export default class FitbitLoggerStack extends cdk.Stack {
  private makeLambda(name: string, handler: string, envVariables: {
    [key: string]: string;
  }, desc?: string): NodejsFunction {
    return new NodejsFunction(this, name, {
      entry: '../src/handler.ts',
      handler,
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: name,
      description: desc ?? '',
      environment: envVariables,
    });
  }

  constructor(scope: cdk.Construct, id: string, props: FitbitLoggerStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: props.hostedZone.name,
      hostedZoneId: props.hostedZone.id,
    });

    const apiDomainName = `fitbit.${hostedZone.zoneName}`;

    const apiCert = new DnsValidatedCertificate(this, 'ApiCertificate', {
      domainName: apiDomainName,
      hostedZone,
      region: Stack.of(this).region,
    });

    const domainName = new DomainName(this, 'DomainName', {
      domainName: apiDomainName,
      certificate: apiCert,
    });

    new ARecord(this, 'ARecord', {
      zone: hostedZone,
      recordName: apiDomainName,
      target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(domainName.regionalDomainName, domainName.regionalHostedZoneId)),
    });

    const table = new Table(this, 'DynamoTable', {
      tableName: 'FitbitSessions',
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'chatId',
        type: AttributeType.STRING,
      },
    });

    const secrets = Secret.fromSecretNameV2(this, 'FitbitLoggerSecret', props.secretsName);

    const envVariables = {
      TELEGRAM_API_TOKEN: secrets.secretValueFromJson('TELEGRAM_API_TOKEN').toString(),
      TELEGRAM_CHAT_ID: secrets.secretValueFromJson('TELEGRAM_CHAT_ID').toString(),
      SECURITY_TOKEN: secrets.secretValueFromJson('SECURITY_TOKEN').toString(),
      CLIENT_ID: secrets.secretValueFromJson('CLIENT_ID').toString(),
      DYNAMODB_TABLE: table.tableName,
    };

    const apiGw = new HttpApi(this, 'HTTPAPI', {
      apiName: 'API for Fitbit  Logger',
      description: 'The API to interact with the Fitbit Bot',
      defaultDomainMapping: {
        domainName,
      },
    });

    const oauthHandler = new NodejsFunction(this, 'OAuthHandler', {
      entry: '../src/handler.ts',
      handler: 'FitbitOAuthResponseHandler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: 'FitbitOAuthHandler',
      description: 'Handles OAuth requests from Fitbit',
      environment: envVariables,
    });

    const messageHandler = new NodejsFunction(this, 'MessageHandler', {
      entry: '../src/handler.ts',
      handler: 'TelegramMessageHandler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: 'FitbitMessageHandler',
      description: 'Handles messages from Fitbit',
      environment: envVariables,
    });

    const fitbitBudgetReminderHandler = new NodejsFunction(this, 'BudgetReminder', {
      entry: '../src/handler.ts',
      handler: 'TelegramMealReminder',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: 'TelegramMealReminder',
      description: 'Reminds to log meals via Telegram',
      environment: envVariables,
    });

    const surplusTransferHandler = new NodejsFunction(this, 'SurplusTransferHandler', {
      entry: '../src/handler.ts',
      handler: 'SurplusTransferer',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: 'SurplusTransferer',
      description: 'Transfers a calorie surplus to the next day',
      environment: envVariables,
    });

    const staticPageHandler = new NodejsFunction(this, 'StaticRedirectPage', {
      entry: '../src/handler.ts',
      handler: 'StaticRedirectPage',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 256,
      functionName: 'StaticRedirectPage',
      description: 'Returns a static redirect page',
      environment: envVariables,
      bundling: {
        commandHooks: {
          // Copy a file so that it will be included in the bundled asset
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`cp ${inputDir}/../src/static/index.html ${outputDir}`];
          },
          beforeBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
        },
      },
    });

    table.grantReadWriteData(messageHandler);
    table.grantReadWriteData(oauthHandler);
    table.grantReadWriteData(surplusTransferHandler);
    table.grantReadWriteData(fitbitBudgetReminderHandler);

    apiGw.addRoutes({
      path: '/im/telegram/{token}',
      methods: [HttpMethod.POST],
      integration: new LambdaProxyIntegration({
        handler: messageHandler,
      }),
    });

    apiGw.addRoutes({
      path: '/auth/fitbit',
      methods: [HttpMethod.GET],
      integration: new LambdaProxyIntegration({
        handler: oauthHandler,
      }),
    });

    apiGw.addRoutes({
      path: '/',
      methods: [HttpMethod.GET],
      integration: new LambdaProxyIntegration({
        handler: staticPageHandler,
      }),
    });

    const logReminder = new Rule(this, 'Reminder', {
      schedule: Schedule.expression('cron(55 9,16 * * ? *)'),
    });

    const surplusTransfer = new Rule(this, 'SurplusTransfer', {
      schedule: Schedule.expression('cron(0 5 * * ? *)'),
    });

    logReminder.addTarget(new LambdaFunction(fitbitBudgetReminderHandler));
    surplusTransfer.addTarget(new LambdaFunction(surplusTransferHandler));
  }
}
