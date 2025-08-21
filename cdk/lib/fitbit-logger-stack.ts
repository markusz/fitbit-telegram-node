import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';
import { DomainName, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface FitbitLoggerStackProps extends StackProps {
  hostedZone: {
    id: string,
    name: string,
  },
  secretsName: string,
  subdomain: string
}

export default class FitbitLoggerStack extends Stack {
  private makeLambda(name: string, handler: string, envVariables: {
    [key: string]: string;
  }, desc?: string): NodejsFunction {
    return new NodejsFunction(this, name, {
      entry: '../src/handler.ts',
      handler,
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: name,
      description: desc ?? '',
      environment: envVariables,
    });
  }

  constructor(scope: Construct, id: string, props: FitbitLoggerStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: props.hostedZone.name,
      hostedZoneId: props.hostedZone.id,
    });

    new Topic(this, 'Notifications', {
      topicName: 'FitbitLoggerNotifications',
      displayName: 'FitbitLoggerNotifications',
    });

    const apiDomainName = `${props.subdomain}.${hostedZone.zoneName}`;

    const apiCert = new Certificate(this, 'ApiCertificate', {
      domainName: apiDomainName,
      validation: CertificateValidation.fromDns(hostedZone),
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

    const table = new Table(this, 'Table', {
      tableName: 'FitbitAuth',
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'chatId',
        type: AttributeType.NUMBER,
      },
    });

    const logTable = new Table(this, 'LogTable', {
      tableName: 'FitbitLogs',
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
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
      LOG_TABLE: logTable.tableName,
      BASE_URL: apiDomainName,
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
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: 'FitbitOAuthHandler',
      description: 'Handles OAuth requests from Fitbit',
      environment: envVariables,
      depsLockFilePath: '../src/package-lock.json',
    });

    const messageHandler = new NodejsFunction(this, 'MessageHandler', {
      entry: '../src/handler.ts',
      handler: 'TelegramMessageHandler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: 'FitbitMessageHandler',
      description: 'Handles messages from Fitbit',
      environment: envVariables,
      depsLockFilePath: '../src/package-lock.json',
    });

    const fitbitBudgetReminderHandler = new NodejsFunction(this, 'BudgetReminder', {
      entry: '../src/handler.ts',
      handler: 'TelegramMealReminder',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: 'TelegramMealReminder',
      description: 'Reminds to log meals via Telegram',
      environment: envVariables,
      depsLockFilePath: '../src/package-lock.json',
    });

    const surplusTransferHandler = new NodejsFunction(this, 'SurplusTransferHandler', {
      entry: '../src/handler.ts',
      handler: 'SurplusTransferer',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: 'SurplusTransferer',
      description: 'Transfers a calorie surplus to the next day',
      environment: envVariables,
      depsLockFilePath: '../src/package-lock.json',
    });

    const staticPageHandler = new NodejsFunction(this, 'StaticRedirectPage', {
      entry: '../src/handler.ts',
      handler: 'StaticRedirectPage',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      functionName: 'StaticRedirectPage',
      description: 'Returns a static redirect page',
      environment: envVariables,
      depsLockFilePath: '../src/package-lock.json',
      bundling: {
        commandHooks: {
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

    logTable.grantReadWriteData(messageHandler);
    logTable.grantReadWriteData(surplusTransferHandler);
    table.grantReadWriteData(messageHandler);
    table.grantReadWriteData(oauthHandler);
    table.grantReadWriteData(surplusTransferHandler);
    table.grantReadWriteData(fitbitBudgetReminderHandler);

    apiGw.addRoutes({
      path: '/im/telegram/{token}',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('MessageHandlerIntegration', messageHandler),
    });

    apiGw.addRoutes({
      path: '/auth/fitbit',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('OAuthHandlerIntegration', oauthHandler),
    });

    apiGw.addRoutes({
      path: '/',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('StaticPageHandlerIntegration', staticPageHandler),
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
