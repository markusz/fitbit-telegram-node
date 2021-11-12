#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import FitbitTelegramLoggerStack from '../lib/fitbit-logger-stack';

const app = new cdk.App();

new FitbitTelegramLoggerStack(app, 'FitbitTelegramLoggerStack', {
  hostedZone: {
    id: 'Z003500238UAU9YFAGQ45',
    name: 'aws.markusziller.de',
  },
  secretsName: 'FitbitTelegramLogger',
});
