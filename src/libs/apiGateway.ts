import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda'
import type { FromSchema } from 'json-schema-to-ts'
import type { User } from '@libs/dynamodb'

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: FromSchema<S> }
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<ValidatedAPIGatewayProxyEvent<S>, APIGatewayProxyResult>
export type ValidatedEventAPIGatewayProxyEventWithUser<S> = Handler<ValidatedAPIGatewayProxyEvent<S> & { user: User }, APIGatewayProxyResult>

export const formatJSONResponse = (response: Record<string, unknown>): Response => {
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  }
}

interface Response {
  statusCode: number
  body: string
}

export type {
  ValidatedAPIGatewayProxyEvent
}
