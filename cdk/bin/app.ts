#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import FitbitTelegramLoggerStack from '../lib/fitbit-logger-stack';

const app = new cdk.App();

new FitbitTelegramLoggerStack(app, 'FitbitTelegramLogger', {
  hostedZone: {
    id: 'Z0350042282R3NOHCRBDS',
    name: 'aws.markusziller.de',
  },
  env: {
    account: '813632919355',
    region: 'eu-west-1',
  },
  secretsName: 'FitbitLoggerSecret',
  subdomain: 'fitbit',
});
