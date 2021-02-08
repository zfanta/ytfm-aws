import type { AWS } from '@serverless/typescript'
import { get, oauth2 } from './src/functions'

const serverlessConfiguration: AWS = {
  useDotenv: true,
  service: 'ytfm',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    dynamodb: {
      stages: ['dev']
    }
  },
  plugins: ['serverless-webpack', 'serverless-dynamodb-local'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      // eslint-disable-next-line no-template-curly-in-string
      CHANNELS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-channels',
      // eslint-disable-next-line no-template-curly-in-string
      USERS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-users',
      // eslint-disable-next-line no-template-curly-in-string
      SUBSCRIPTIONS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-subscriptions',
      // eslint-disable-next-line no-template-curly-in-string
      GOOGLE_CLIENT_ID: '${env:GOOGLE_CLIENT_ID}',
      // eslint-disable-next-line no-template-curly-in-string
      GOOGLE_CLIENT_SECRET: '${env:GOOGLE_CLIENT_SECRET}',
      // eslint-disable-next-line no-template-curly-in-string
      OAUTH2_REDIRECT_URL: 'https://${opt:stage, self:provider.stage}.ytfm.app/oauth2'
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [{
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:BatchWriteItem'
      ],
      // eslint-disable-next-line no-template-curly-in-string
      Resource: 'arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/*'
    }]
  },
  functions: { get, oauth2 },
  resources: {
    Resources: {
      channels: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          // eslint-disable-next-line no-template-curly-in-string
          TableName: '${self:provider.environment.CHANNELS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'id',
            AttributeType: 'S'
          }, {
            AttributeName: 'expiresAt',
            AttributeType: 'N'
          }],
          KeySchema: [{
            AttributeName: 'id',
            KeyType: 'HASH'
          }],
          GlobalSecondaryIndexes: [{
            IndexName: 'expiresAt-idx',
            KeySchema: [{
              AttributeName: 'expiresAt',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'ALL'
            }
          }]
        }
      },
      users: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          // eslint-disable-next-line no-template-curly-in-string
          TableName: '${self:provider.environment.USERS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'email',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'email',
            KeyType: 'HASH'
          }]
        }
      },
      subscriptions: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          // eslint-disable-next-line no-template-curly-in-string
          TableName: '${self:provider.environment.SUBSCRIPTIONS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'channel',
            AttributeType: 'S'
          }, {
            AttributeName: 'user',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'channel',
            KeyType: 'HASH'
          }, {
            AttributeName: 'user',
            KeyType: 'RANGE'
          }],
          GlobalSecondaryIndexes: [{
            IndexName: 'user-idx',
            KeySchema: [{
              AttributeName: 'user',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'ALL'
            }
          }]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration
