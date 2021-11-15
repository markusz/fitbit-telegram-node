#!/usr/bin/env node

import * as cdk from '@aws-cdk/core';
import {
  Construct, Stack, StackProps, Stage, StageProps,
} from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import FitbitTelegramLoggerStack, { FitbitLoggerStackProps } from '../lib/fitbit-logger-stack';

const app = new cdk.App();
const cdkVersion = require('../package.json').devDependencies['aws-cdk'];

interface FitbitTelegramLoggerStageProps extends StageProps, FitbitLoggerStackProps {

}

class FitbitTelegramLoggerStage extends Stage {
  constructor(scope: Construct, id: string, props: FitbitTelegramLoggerStageProps) {
    super(scope, id, props);

    new FitbitTelegramLoggerStack(this, 'FitbitTelegramLoggerStack', props);
  }
}

class FitbitTelegramLoggerPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      selfMutation: false,
      cliVersion: cdkVersion,
      pipelineName: 'FitbitLoggerCICD',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('markusz/fitbit-telegram-node', 'master', {
          authentication: cdk.SecretValue.secretsManager('GithubPersonalToken', {
            jsonField: 'oauthToken',
          }),
        }),
        primaryOutputDirectory: './cdk/cdk.out',
        commands: [
          'cd src',
          'npm i',
          'cd ../cdk',
          'npm i',
          'npm i -g esbuild',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    const wave = pipeline.addWave('MultiRegionDeployment');

    wave.addStage(new FitbitTelegramLoggerStage(this, 'EuWest1', {
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

    wave.addStage(new FitbitTelegramLoggerStage(this, 'UsEast1', {
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

new FitbitTelegramLoggerPipeline(app, 'FitbitTelegramLoggerPipeline', {
  env: {
    account: '321869685577',
    region: 'eu-central-1',
  },
});

new FitbitTelegramLoggerStack(app, 'FitbitTelegramLoggerStack', {
  hostedZone: {
    id: 'Z003500238UAU9YFAGQ45',
    name: 'aws.markusziller.de',
  },
  secretsName: 'FitbitTelegramLogger',
  subdomain: 'fitbit',
});
