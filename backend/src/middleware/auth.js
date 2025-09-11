const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { AuthError } = require('../errors/AppError');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header) throw new AuthError('No token provided');
    const token = header.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      throw new AuthError('Invalid token');
    }
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) throw new AuthError('Invalid token');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = auth;
