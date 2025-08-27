const { NotFoundError } = require('../../errors/AppError');

module.exports = function notFound(req, res, next) {
  next(new NotFoundError('Route not found'));
};
