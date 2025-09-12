const _ = require('lodash');

const defaultPatterns = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\+?\d{10,14}/g,
  apiKey: /[A-Za-z0-9]{32,}/g,
  creditCard: /4[0-9]{12}(?:[0-9]{3})?/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  username: /@[a-zA-Z0-9_]{1,15}/g
};

function maskString(str, type, mode = 'partial') {
  if (mode === 'total') return '********';
  switch (type) {
    case 'email':
      return str.replace(/(.{1,2})(.*)@(.{1,2})(.*)\.(.*)/, '$1***@$3***.$5');
    case 'phone':
      return str.slice(0, 3) + '****' + str.slice(-4);
    case 'apiKey':
      return str.slice(0, 4) + '****' + str.slice(-4);
    case 'creditCard':
      return '****-****-****-' + str.slice(-4);
    case 'ipAddress':
      return str.replace(/\d{1,3}$/, '***');
    case 'username':
      return '@' + '*'.repeat(str.length - 1);
    default:
      return str;
  }
}

function maskData(data, options = { mode: 'partial', patterns: defaultPatterns }) {
  if (!data) {
    throw new Error('Data is required');
  }
  const patterns = { ...defaultPatterns, ...options.patterns };

  if (_.isString(data)) {
    let result = data;
    for (const [type, pattern] of Object.entries(patterns)) {
      result = result.replace(pattern, (match) => maskString(match, type, options.mode));
    }
    return result;
  }
  if (_.isObject(data)) {
    return _.mapValues(data, (value) => maskData(value, options));
  }
  if (_.isArray(data)) {
    return data.map((item) => maskData(item, options));
  }
  return data;
}

function maskMiddleware(options = { mode: 'partial', patterns: defaultPatterns }) {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      try {
        return originalJson.call(this, maskData(data, options));
      } catch (error) {
        console.error('Error in masking:', error);
        return originalJson.call(this, data);
      }
    };
    next();
  };
}

const originalLog = console.log;
console.log = (...args) => {
  try {
    const maskedArgs = args.map((arg) => maskData(arg));
    originalLog(...maskedArgs);
  } catch (error) {
    originalLog(...args); 
  }
};

module.exports = { maskData, maskMiddleware };