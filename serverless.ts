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
      VIDEOS_TABLE_NAME: 'ytfm-${opt:stage, self:provider.stage}-videos',
      // eslint-disable-next-line no-template-curly-in-string
      GOOGLE_CLIENT_ID: '${env:GOOGLE_CLIENT_ID}',
      // eslint-disable-next-line no-template-curly-in-string
      GOOGLE_CLIENT_SECRET: '${env:GOOGLE_CLIENT_SECRET}',
      // eslint-disable-next-line no-template-curly-in-string
      OAUTH2_REDIRECT_URL: 'https://${opt:stage, self:provider.stage}.ytfm.app/api/oauth2',
      // eslint-disable-next-line no-template-curly-in-string
      PUBSUBHUBBUB_QUEUE_NAME: 'ytfm-${opt:stage, self:provider.stage}-pubsubhubbub',
      // eslint-disable-next-line no-template-curly-in-string
      EMAIL_QUEUE_NAME: 'ytfm-${opt:stage, self:provider.stage}-email',
      // eslint-disable-next-line no-template-curly-in-string
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
        'dynamodb:PartiQLSelect'
      ],
      // eslint-disable-next-line no-template-curly-in-string
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
      // eslint-disable-next-line no-template-curly-in-string
      Resource: 'arn:aws:ses:${opt:region, self:provider.region}:*:identity/*'
    }, {
      Effect: 'Allow',
      Action: ['ses:SendTemplatedEmail'],
      // eslint-disable-next-line no-template-curly-in-string
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
      videos: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          // eslint-disable-next-line no-template-curly-in-string
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
      },
      pubsubhubbubQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          // eslint-disable-next-line no-template-curly-in-string
          QueueName: '${self:provider.environment.PUBSUBHUBBUB_QUEUE_NAME}'
        }
      },
      emailQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          // eslint-disable-next-line no-template-curly-in-string
          QueueName: '${self:provider.environment.EMAIL_QUEUE_NAME}'
        }
      }
    }
  }
}

module.exports = serverlessConfiguration
