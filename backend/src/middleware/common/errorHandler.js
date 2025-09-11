const { AppError } = require('../../errors/AppError');
const { loadEnv } = require('../../config/env');
const { logger } = require('../../logger');

const env = loadEnv();

module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line
  if (!(err instanceof AppError)) {
    logger.error({ err, reqId: req.id }, 'unhandled error');
    if (env.NODE_ENV === 'development') {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message, stack: err.stack, requestId: req.id } });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', requestId: req.id } });
  }
  if (err.isOperational === false) {
    logger.error({ err, reqId: req.id }, 'non-operational app error');
  } else {
    req.log?.warn({ code: err.code, meta: err.meta }, 'app error');
  }
  const body = { error: { code: err.code, message: err.message, requestId: req.id } };
  if (env.NODE_ENV === 'development' && err.meta) body.error.meta = err.meta;
  res.status(err.httpStatus || 500).json(body);
};
