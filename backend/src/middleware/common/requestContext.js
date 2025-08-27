const { v4: uuid } = require('uuid');
const { logger } = require('../../logger');

module.exports = function requestContext(req, res, next) {
  const id = uuid();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  const start = Date.now();
  req.log = logger.child({ reqId: id, method: req.method, path: req.originalUrl });
  res.on('finish', () => {
    req.log.info({ status: res.statusCode, durationMs: Date.now() - start }, 'req completed');
  });
  next();
};
