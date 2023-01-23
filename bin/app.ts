#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { BillingStack } from '../lib/billing-stack';
import { ServiceStack } from '../lib/server-stack';

const app = new cdk.App();
const pipeline = new AppStack(app, 'AppStack', {
  
});

new BillingStack(app, 'BillingStack', {
  budgetAmount: 5,
  emailAddress: 'hunter.clark@utexas.edu'
});

const serviceStackProd = new ServiceStack(app, 'ServiceStackProd')

pipeline.addServiceStage(serviceStackProd, "Prod")