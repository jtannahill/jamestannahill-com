#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';
import { ContactStack } from '../lib/contact-stack';

const app = new cdk.App();

new StaticSiteStack(app, 'JamesTannahillSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  domainName: 'jamestannahill.com',
});

new ContactStack(app, 'JamesTannahillContactStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
