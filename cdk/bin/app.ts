#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {
  Construct, Stack, StackProps, Stage, StageProps,
} from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import FitbitTelegramLoggerStack, { FitbitLoggerStackProps } from '../lib/fitbit-logger-stack';

const app = new cdk.App();

interface FitbitTelegramLoggerStageProps extends StageProps, FitbitLoggerStackProps {

}

class FitbitTelegramLoggerStage extends Stage {
  constructor(scope: Construct, id: string, props: FitbitTelegramLoggerStageProps) {
    super(scope, id, props);

    new FitbitTelegramLoggerStack(app, 'FitbitTelegramLoggerStack', props);
  }
}

class FitbitTelegramLoggerPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('markusz/fitbit-telegram-node', 'master', {
          authentication: cdk.SecretValue.secretsManager('GithubPersonalToken', {
            jsonField: 'oauthToken',
          }),
        }),
        commands: [
          'npm run build',
          'npx cdk synth',
          'npx cdk deploy FitbitTelegramLoggerPipeline --require-approval never',
        ],
      }),
    });

    pipeline.addStage(new FitbitTelegramLoggerStage(this, 'EuWest1', {
      hostedZone: {
        id: 'Z003500238UAU9YFAGQ45',
        name: 'aws.markusziller.de',
      },
      secretsName: 'FitbitTelegramLogger',
      subdomain: 'logger-eu-west-1',
      env: {
        account: '321869685577',
        region: 'eu-west-1',
      },
    }));

    pipeline.addStage(new FitbitTelegramLoggerStage(this, 'UsEast1', {
      hostedZone: {
        id: 'Z003500238UAU9YFAGQ45',
        name: 'aws.markusziller.de',
      },
      secretsName: 'FitbitTelegramLogger',
      subdomain: 'logger-us-east-1',
      env: {
        account: '321869685577',
        region: 'us-east-1',
      },
    }));
  }
}

new FitbitTelegramLoggerPipeline(app, 'FitbitTelegramLoggerPipeline');

new FitbitTelegramLoggerStack(app, 'FitbitTelegramLoggerStack', {
  hostedZone: {
    id: 'Z003500238UAU9YFAGQ45',
    name: 'aws.markusziller.de',
  },
  secretsName: 'FitbitTelegramLogger',
  subdomain: 'fitbit',
});
