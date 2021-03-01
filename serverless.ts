/* eslint-disable no-template-curly-in-string */

import type { AWS } from '@serverless/typescript'
import functions from './src/functions'

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
    },
    fullstack: {
      domain: '${opt:stage, self:provider.stage}.ytfm.app',
      // TODO:
      certificate: 'arn:aws:acm:us-east-1:756346208077:certificate/8e69b6f6-ff85-4c76-b203-9902da44bd7a',
      bucketName: 'web',
      distributionFolder: 'dist/frontend/build',
      indexDocument: 'index.html',
      singlePageApp: true,
      compressWebContent: true,
      apiPath: 'api',
      clientCommand: 'yarn parcel:build',
      minimumProtocolVersion: 'TLSv1.2_2018',
      priceClass: 'PriceClass_100'
    }
  },
  plugins: ['serverless-webpack', 'serverless-dynamodb-local', 'fullstack-serverless', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      CHANNELS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-channels',
      USERS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-users',
      SUBSCRIPTIONS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-subscriptions',
      VIDEOS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-videos',
      SESSIONS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-sessions',
      GOOGLE_CLIENT_ID: '${env:GOOGLE_CLIENT_ID}',
      GOOGLE_CLIENT_SECRET: '${env:GOOGLE_CLIENT_SECRET}',
      GOOGLE_API_KEY: '${env:GOOGLE_API_KEY}',
      OAUTH2_REDIRECT_URL: 'https://${opt:stage, self:provider.stage}.ytfm.app/api/oauth2',
      PUBSUBHUBBUB_QUEUE_NAME: 'ytfm-${opt:stage, self:provider.stage}-pubsubhubbub',
      EMAIL_QUEUE_NAME: 'ytfm-${opt:stage, self:provider.stage}-email',
      STAGE: '${opt:stage, self:provider.stage}'
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
        'dynamodb:BatchWriteItem',
        'dynamodb:PartiQLSelect',
        'dynamodb:BatchGetItem'
      ],
      Resource: 'arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/*'
    }, {
      Effect: 'Allow',
      Action: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
      Resource: [{
        'Fn::GetAtt': ['pubsubhubbubQueue', 'Arn']
      }, {
        'Fn::GetAtt': ['emailQueue', 'Arn']
      }]
    }, {
      Effect: 'Allow',
      Action: ['ses:SendCustomVerificationEmail'],
      Resource: 'arn:aws:ses:${opt:region, self:provider.region}:*:identity/*'
    }, {
      Effect: 'Allow',
      Action: ['ses:SendTemplatedEmail'],
      Resource: 'arn:aws:ses:${opt:region, self:provider.region}:*:identity/*'
    }]
  },
  functions,
  resources: {
    Resources: {
      channels: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
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
      videos: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.VIDEOS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'id',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'id',
            KeyType: 'HASH'
          }]
        }
      },
      subscriptions: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
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
      },
      sessions: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.SESSIONS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'id',
            AttributeType: 'S'
          }, {
            AttributeName: 'user',
            AttributeType: 'S'
          }, {
            AttributeName: 'atime',
            AttributeType: 'N'
          }, {
            AttributeName: 'expiresAt',
            AttributeType: 'N'
          }],
          KeySchema: [{
            AttributeName: 'id',
            KeyType: 'HASH'
          }],
          GlobalSecondaryIndexes: [{
            IndexName: 'empty-idx',
            KeySchema: [{
              AttributeName: 'user',
              KeyType: 'HASH'
            }, {
              AttributeName: 'atime',
              KeyType: 'RANGE'
            }],
            Projection: {
              ProjectionType: 'KEYS_ONLY'
            }
          }, {
            IndexName: 'expiresAt-idx',
            KeySchema: [{
              AttributeName: 'expiresAt',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'KEYS_ONLY'
            }
          }, {
            IndexName: 'user-idx',
            KeySchema: [{
              AttributeName: 'user',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'KEYS_ONLY'
            }
          }]
        }
      },
      pubsubhubbubQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.PUBSUBHUBBUB_QUEUE_NAME}'
        }
      },
      emailQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.EMAIL_QUEUE_NAME}'
        }
      }
    }
  }
}

module.exports = serverlessConfiguration
