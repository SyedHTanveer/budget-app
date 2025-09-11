const pino = require('pino');
const { loadEnv } = require('../config/env');

const env = loadEnv();

const redactions = [
  'req.headers.authorization',
  'req.body.password',
  'req.body.token',
  'refresh_token',
  'access_token'
];

const isDev = env.NODE_ENV === 'development';

const logger = pino({
  level: env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: { paths: redactions, remove: true },
  transport: isDev ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
  } : undefined
});

module.exports = { logger };
