/* eslint-disable no-template-curly-in-string */

import type { AWS } from '@serverless/typescript'
import functions from './src/functions'

const serverlessConfiguration: AWS = {
  useDotenv: true,
  service: 'ytfm',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.api.js',
      includeModules: true
    },
    dynamodb: {
      stages: ['dev']
    },
    fullstack: {
      domain: "${opt:stage, 'dev'}.ytfm.app",
      allowCache: false,
      certificate: 'arn:aws:acm:us-east-1:756346208077:certificate/8e69b6f6-ff85-4c76-b203-9902da44bd7a',
      bucketName: 'web',
      distributionFolder: 'dist/frontend/build',
      indexDocument: 'index.html',
      singlePageApp: true,
      compressWebContent: true,
      apiPath: 'api',
      clientCommand: 'yarn webpack:build',
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
      CHANNELS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-channels",
      USERS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-users",
      SUBSCRIPTIONS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-subscriptions",
      VIDEOS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-videos",
      SESSIONS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-sessions",
      KEYS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-keys",
      REGIONS_TABLE_NAME: "ytfm-${opt:stage, 'dev'}-regions",
      GOOGLE_CLIENT_ID: '${env:GOOGLE_CLIENT_ID}',
      GOOGLE_CLIENT_SECRET: '${env:GOOGLE_CLIENT_SECRET}',
      GOOGLE_API_KEY: '${env:GOOGLE_API_KEY}',
      STAGE: "${opt:stage, 'dev'}",
      PUBSUBHUBBUB_QUEUE_NAME: 'ytfm-${opt:stage, self:provider.stage}-pubsubhubbub'
    },
    lambdaHashingVersion: '20201221',
    iam: {
      role: {
        statements: [{
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
          Resource: "arn:aws:dynamodb:${opt:region, 'us-east-1'}:*:table/*"
        }, {
          Effect: 'Allow',
          Action: ['ses:SendCustomVerificationEmail'],
          Resource: "arn:aws:ses:${opt:region, 'us-east-1'}:*:identity/*"
        }, {
          Effect: 'Allow',
          Action: ['ses:SendTemplatedEmail', 'ses:SendRawEmail'],
          Resource: "arn:aws:ses:${opt:region, 'us-east-1'}:*:identity/*"
        }, {
          Effect: 'Allow',
          Action: ['sqs:SendMessage', 'sqs:GetQueueUrl', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
          Resource: [{
            'Fn::GetAtt': ['pubsubhubbubQueue', 'Arn']
          }]
        }, {
          Effect: 'Allow',
          Action: ['lambda:InvokeFunction'],
          Resource: "arn:aws:lambda:${opt:region, 'us-east-1'}:*:function:*"
        }]
      }
    }
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
      keys: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.KEYS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'type',
            AttributeType: 'S'
          }, {
            AttributeName: 'createdAt',
            AttributeType: 'N'
          }],
          KeySchema: [{
            AttributeName: 'type',
            KeyType: 'HASH'
          }, {
            AttributeName: 'createdAt',
            KeyType: 'RANGE'
          }]
        }
      },
      regions: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.REGIONS_TABLE_NAME}',
          AttributeDefinitions: [{
            AttributeName: 'language',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'language',
            KeyType: 'HASH'
          }]
        }
      },
      pubsubhubbubQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:provider.environment.PUBSUBHUBBUB_QUEUE_NAME}'
        }
      }
    }
  }
}

module.exports = serverlessConfiguration
