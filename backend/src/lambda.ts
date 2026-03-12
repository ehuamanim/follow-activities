import serverlessExpress from '@codegenie/serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import app from './app';

let serverlessExpressInstance: any;

async function setup(event: APIGatewayProxyEvent, context: Context) {
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
}

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  if (serverlessExpressInstance) return serverlessExpressInstance(event, context);
  return setup(event, context);
};
