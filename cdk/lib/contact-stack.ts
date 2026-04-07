import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ContactStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'ContactFn', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('lambda/contact'),
      timeout: cdk.Duration.seconds(15),
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    const integration = new integrations.HttpLambdaIntegration('ContactIntegration', fn);

    const api = new apigateway.HttpApi(this, 'ContactApi', {
      corsPreflight: {
        allowOrigins: ['https://www.jamestannahill.com'],
        allowMethods: [apigateway.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    });

    api.addRoutes({
      path: '/contact',
      methods: [apigateway.HttpMethod.POST],
      integration,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `${api.apiEndpoint}/contact`,
      description: 'Contact form API endpoint — paste into ContactForm.astro',
    });
  }
}
