import type { AWS } from '@serverless/typescript'

import { get } from './src/functions'

const serverlessConfiguration: AWS = {
  service: 'pubsubhubbub',
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
      CHANNELS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-channels'
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
        'dynamodb:DeleteItem'
      ],
      // eslint-disable-next-line no-template-curly-in-string
      Resource: 'arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.CHANNELS_TABLE_NAME}'
    }]
  },
  functions: { get },
  resources: {
    Resources: {
      channels: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
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
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          },
          GlobalSecondaryIndexes: [{
            IndexName: 'expiresAt-idx',
            KeySchema: [{
              AttributeName: 'expiresAt',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration
