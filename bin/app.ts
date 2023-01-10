#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { BillingStack } from '../lib/billing-stack';

const app = new cdk.App();
new AppStack(app, 'AppStack', {
  
});

new BillingStack(app, 'BillingStack', {
  budgetAmount: 5,
  emailAddress: 'hunter.clark@utxas.edu'
});