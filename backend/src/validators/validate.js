const AppError = require('../utils/AppError');

const required = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw new AppError(`Missing required fields: ${missing.join(', ')}.`, 400, 'VALIDATION_ERROR');
};

const objectId = (value) => /^[a-f\d]{24}$/i.test(String(value));

const assertObjectId = (value, name = 'id') => {
  if (!objectId(value)) throw new AppError(`Invalid ${name}.`, 400, 'INVALID_ID');
};

module.exports = { assertObjectId, required };
