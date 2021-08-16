#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { BillingStack } from '../lib/BillingStack';

const app = new cdk.App();
new PipelineStack(app, 'PipelineStack', { });
new BillingStack(app, "BillingStack", {
  budgetAmount: 30,
  emailAddress:  "d503.the.integral@gmail.com"
})