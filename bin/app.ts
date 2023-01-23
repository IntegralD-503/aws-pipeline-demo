#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { BillingStack } from '../lib/billing-stack';
import { ServiceStack } from '../lib/server-stack';

const app = new cdk.App();
const pipelineStack = new AppStack(app, 'AppStack', {
  
});

const billingStack = new BillingStack(app, 'BillingStack', {
  budgetAmount: 30,
  emailAddress: 'hunter.clark@utexas.edu'
});

const serviceStackProd = new ServiceStack(app, 'ServiceStackProd')

const prodStage = pipelineStack.addServiceStage(serviceStackProd, "Prod")

pipelineStack.addBillingStackToStage(billingStack, prodStage);