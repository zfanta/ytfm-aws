import type { AWS } from '@serverless/typescript';

import { get } from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'pubsubhubbub',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    stage: '${opt:stage, self:provider.stage}'
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: { get },
  resources: {
    Resources: {
      channels: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'channels-${self:custom.stage}',
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
          }, {
            AttributeName: 'expiresAt',
            KeyType: 'RANGE'
          }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
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
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1
            }
          }]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
