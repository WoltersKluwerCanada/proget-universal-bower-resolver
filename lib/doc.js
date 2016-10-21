// This file is here to contain global JsDoc definitions

// Global bowerObj doc
/**
 * @typedef {{}} bowerObj
 * @property {bowerLogger} logger - the Bower logger
 * @property {bowerConf} config - The Bower configuration
 * @property {string} version - Bower’s version that instantiates resolver
 */

/**
 * @typedef {{}} bowerLogger
 * @property {function} [error] - Alias to .log('error', id, message, data)
 * @property {function} [conflict] - Alias to .log('conflict', id, message, data)
 * @property {function} [warn] - Alias to .log('warn', id, message, data)
 * @property {function} [action] - Alias to .log('action', id, message, data)
 * @property {function} [info] - Alias to .log('info', id, message, data)
 * @property {function} [debug] - Alias to .log('debug', id, message, data)
 * @property {function} [log] - Emits a log event
 * @property {function} [prompt] - Emits a prompt event with an array of prompts with a callback
 * @property {function} [pipe] - Pipes all logger events to another logger.
 * @property {function} [geminate] - Creates a new logger that pipes events to the parent logger.
 * @property {function} [intercept] - Intercepts log events, calling fn before listeners of the instance.
 */

/**
 * @typedef {{}} bowerConf
 * @property {string} httpsProxy
 * @property {string} proxy
 * @property {ca} ca
 * @property {boolean} strictSsl
 * @property {number} timeout
 * @property {string} request
 * @property {progetConf} proget
 * @property {number} [retry]
 */

/**
 * @typedef {{}} ca
 * @property {Array} search
 */

// Global progetConf doc
/**
 * @typedef {{}} progetConf
 * @property {string} group
 * @property {string} apiKey
 * @property {string} feedId
 */
