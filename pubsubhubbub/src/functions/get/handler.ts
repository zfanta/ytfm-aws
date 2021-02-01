import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  // TODO: add to db
  return {
    statusCode: 200,
    body: event.queryStringParameters['hub.challenge']
  }
}

export const main = middyfy(get);
