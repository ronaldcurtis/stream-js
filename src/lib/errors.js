const canCapture = typeof Error.captureStackTrace === 'function';
const canStack = !!new Error().stack;

/**
 * Abstract error object
 * @class ErrorAbstract
 * @access private
 * @param  {string}      [msg]         Error message
 */
class ErrorAbstract extends Error {
  constructor(msg) {
    super(msg);

    this.message = msg;

    if (canCapture) {
      Error.captureStackTrace(this, constructor);
    } else if (canStack) {
      this.stack = new Error().stack;
    } else {
      this.stack = '';
    }
  }
}

/**
 * FeedError
 * @class FeedError
 * @access private
 * @extends ErrorAbstract
 * @memberof Stream.errors
 * @param {String} [msg] - An error message that will probably end up in a log.
 */
class FeedError extends ErrorAbstract {}

/**
 * SiteError
 * @class SiteError
 * @access private
 * @extends ErrorAbstract
 * @memberof Stream.errors
 * @param  {string}  [msg]  An error message that will probably end up in a log.
 */
class SiteError extends ErrorAbstract {}

/**
 * MissingSchemaError
 * @method MissingSchemaError
 * @access private
 * @extends ErrorAbstract
 * @memberof Stream.errors
 * @param  {string} msg
 */
class MissingSchemaError extends ErrorAbstract {}

/**
 * StreamApiError
 * @method StreamApiError
 * @access private
 * @extends ErrorAbstract
 * @memberof Stream.errors
 * @param  {string} msg
 * @param  {object} data
 * @param  {object} response
 */
class StreamApiError extends ErrorAbstract {
  constructor(msg, data, response) {
    super(msg);

    this.error = data;
    this.response = response;
  }
}

export default {
  FeedError,
  SiteError,
  MissingSchemaError,
  StreamApiError,
};
