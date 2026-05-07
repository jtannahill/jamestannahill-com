#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack';

const app = new cdk.App();

// Contact form was migrated off Lambda + API Gateway to a Cloudflare Worker
// (Astro Action) on 2026-05-07. StaticSiteStack remains because the RDLB
// video files (>25 MiB, exceeds Workers Static Assets per-file limit) are
// served from d9ttkh3tz30f6.cloudfront.net via src/components/RDLBReel.astro.
new StaticSiteStack(app, 'JamesTannahillSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  domainName: 'jamestannahill.com',
});
